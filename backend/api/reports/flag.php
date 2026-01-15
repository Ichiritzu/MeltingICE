<?php
/**
 * Flag Report API
 * POST /api/reports/flag.php
 * 
 * Body: { "report_id": "...", "reason": "spam|false_info|harassment|personal_info|other", "details": "..." }
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
$reason = isset($input['reason']) ? trim($input['reason']) : '';
$details = isset($input['details']) ? trim($input['details']) : null;

// Validate
if (empty($reportId)) {
    sendError('report_id is required', 400);
}

$validReasons = ['spam', 'false_info', 'harassment', 'personal_info', 'other'];
if (!in_array($reason, $validReasons)) {
    sendError('reason must be one of: ' . implode(', ', $validReasons), 400);
}

// Sanitize details
if ($details) {
    $details = substr($details, 0, 500); // Max 500 chars
}

try {
    $pdo = getDB();
    $ipHash = getClientIPHash();
    
    // Check report exists
    $stmt = $pdo->prepare("SELECT id FROM public_reports WHERE id = ?");
    $stmt->execute([$reportId]);
    if (!$stmt->fetch()) {
        sendError('Report not found', 404);
    }
    
    // Check if user already flagged
    $stmt = $pdo->prepare("SELECT id FROM report_flags WHERE report_id = ? AND ip_hash = ?");
    $stmt->execute([$reportId, $ipHash]);
    if ($stmt->fetch()) {
        sendError('You have already flagged this report', 400);
    }
    
    // Create flag
    $stmt = $pdo->prepare("INSERT INTO report_flags (report_id, ip_hash, reason, details) VALUES (?, ?, ?, ?)");
    $stmt->execute([$reportId, $ipHash, $reason, $details]);
    
    // Update flag count on report
    $stmt = $pdo->prepare("UPDATE public_reports SET flag_count = flag_count + 1 WHERE id = ?");
    $stmt->execute([$reportId]);
    
    // Recalculate confidence
    $stmt = $pdo->prepare("
        SELECT upvotes, downvotes, flag_count, image_url IS NOT NULL as has_image, 
               evidence_present, is_verified, LENGTH(summary) as summary_length,
               city IS NOT NULL AND state IS NOT NULL as has_location
        FROM public_reports WHERE id = ?
    ");
    $stmt->execute([$reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($report) {
        $score = 20;
        if ($report['has_image'] || $report['evidence_present']) $score += 30;
        if ($report['has_location']) $score += 5;
        if ($report['summary_length'] > 50) $score += 10;
        if ($report['is_verified']) $score += 20;
        $score += ($report['upvotes'] * 3);
        $score -= ($report['downvotes'] * 5);
        $score -= ($report['flag_count'] * 10);
        $score = max(0, min(100, $score));
        
        $stmt = $pdo->prepare("UPDATE public_reports SET confidence = ? WHERE id = ?");
        $stmt->execute([$score, $reportId]);
    }
    
    // Auto-hide if too many flags
    $stmt = $pdo->prepare("SELECT flag_count FROM public_reports WHERE id = ?");
    $stmt->execute([$reportId]);
    $flagCount = $stmt->fetchColumn();
    
    if ($flagCount >= 3) {
        $stmt = $pdo->prepare("UPDATE public_reports SET is_hidden = 1 WHERE id = ? AND is_hidden = 0");
        $stmt->execute([$reportId]);
    }
    
    sendSuccess([
        'report_id' => $reportId,
        'reason' => $reason,
    ], 'Report flagged. Thank you for helping keep the community safe.');

} catch (PDOException $e) {
    error_log('Flag error: ' . $e->getMessage());
    sendError('Database error', 500);
}
