<?php
/**
 * Vote on Report API
 * POST /api/reports/vote.php
 * 
 * Body: { "report_id": "...", "vote_type": "up" | "down" }
 */

require_once __DIR__ . '/../init.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError('Invalid JSON input', 400);
}

$reportId = isset($input['report_id']) ? trim($input['report_id']) : '';
$voteType = isset($input['vote_type']) ? trim($input['vote_type']) : '';

// Validate
if (empty($reportId)) {
    sendError('report_id is required', 400);
}

if (!in_array($voteType, ['up', 'down'])) {
    sendError('vote_type must be "up" or "down"', 400);
}

try {
    $pdo = getDB();
    $ipHash = getClientIPHash();
    
    // Check report exists and is visible
    $stmt = $pdo->prepare("SELECT id FROM public_reports WHERE id = ? AND is_hidden = 0");
    $stmt->execute([$reportId]);
    if (!$stmt->fetch()) {
        sendError('Report not found', 404);
    }
    
    // Check if user already voted
    $stmt = $pdo->prepare("SELECT vote_type FROM report_votes WHERE report_id = ? AND ip_hash = ?");
    $stmt->execute([$reportId, $ipHash]);
    $existingVote = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingVote) {
        if ($existingVote['vote_type'] === $voteType) {
            // Same vote - remove it (toggle off)
            $stmt = $pdo->prepare("DELETE FROM report_votes WHERE report_id = ? AND ip_hash = ?");
            $stmt->execute([$reportId, $ipHash]);
            
            // Update counts
            if ($voteType === 'up') {
                $pdo->prepare("UPDATE public_reports SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ?")->execute([$reportId]);
            } else {
                $pdo->prepare("UPDATE public_reports SET downvotes = GREATEST(0, downvotes - 1) WHERE id = ?")->execute([$reportId]);
            }
            
            // Recalculate confidence
            recalculateConfidence($pdo, $reportId);
            
            sendSuccess(['action' => 'removed', 'vote_type' => null], 'Vote removed');
        } else {
            // Different vote - update it
            $stmt = $pdo->prepare("UPDATE report_votes SET vote_type = ? WHERE report_id = ? AND ip_hash = ?");
            $stmt->execute([$voteType, $reportId, $ipHash]);
            
            // Update counts (switch vote)
            if ($voteType === 'up') {
                $pdo->prepare("UPDATE public_reports SET upvotes = upvotes + 1, downvotes = GREATEST(0, downvotes - 1) WHERE id = ?")->execute([$reportId]);
            } else {
                $pdo->prepare("UPDATE public_reports SET downvotes = downvotes + 1, upvotes = GREATEST(0, upvotes - 1) WHERE id = ?")->execute([$reportId]);
            }
            
            // Recalculate confidence
            recalculateConfidence($pdo, $reportId);
            
            sendSuccess(['action' => 'changed', 'vote_type' => $voteType], 'Vote changed');
        }
    } else {
        // New vote
        $stmt = $pdo->prepare("INSERT INTO report_votes (report_id, ip_hash, vote_type) VALUES (?, ?, ?)");
        $stmt->execute([$reportId, $ipHash, $voteType]);
        
        // Update counts
        if ($voteType === 'up') {
            $pdo->prepare("UPDATE public_reports SET upvotes = upvotes + 1 WHERE id = ?")->execute([$reportId]);
        } else {
            $pdo->prepare("UPDATE public_reports SET downvotes = downvotes + 1 WHERE id = ?")->execute([$reportId]);
        }
        
        // Recalculate confidence
        recalculateConfidence($pdo, $reportId);
        
        sendSuccess(['action' => 'added', 'vote_type' => $voteType], 'Vote recorded');
    }

} catch (PDOException $e) {
    error_log('Vote error: ' . $e->getMessage());
    sendError('Database error', 500);
}

/**
 * Recalculate confidence score for a report
 */
function recalculateConfidence(PDO $pdo, string $reportId): void {
    $stmt = $pdo->prepare("
        SELECT 
            upvotes, 
            downvotes, 
            flag_count,
            image_url IS NOT NULL as has_image,
            evidence_present,
            is_verified,
            LENGTH(summary) as summary_length,
            city IS NOT NULL AND state IS NOT NULL as has_location
        FROM public_reports WHERE id = ?
    ");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$report) return;
    
    // Base score
    $score = 20;
    
    // Photo bonus
    if ($report['has_image'] || $report['evidence_present']) {
        $score += 30;
    }
    
    // Location bonus
    if ($report['has_location']) {
        $score += 5;
    }
    
    // Description bonus
    if ($report['summary_length'] > 50) {
        $score += 10;
    }
    
    // Verified bonus
    if ($report['is_verified']) {
        $score += 20;
    }
    
    // Community votes
    $score += ($report['upvotes'] * 3);
    $score -= ($report['downvotes'] * 5);
    $score -= ($report['flag_count'] * 10);
    
    // Clamp to 0-100
    $score = max(0, min(100, $score));
    
    $stmt = $pdo->prepare("UPDATE public_reports SET confidence = ? WHERE id = ?");
    $stmt->execute([$score, $reportId]);
}
