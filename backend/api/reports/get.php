<?php
/**
 * GET /api/reports/get.php?id=xxx
 * Fetches a single public report by ID
 */

require_once __DIR__ . '/../init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$id = $_GET['id'] ?? null;

if (!$id) {
    sendError('Report ID is required');
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            created_at,
            event_time_bucket, 
            visible_at,
            lat_approx, 
            lng_approx, 
            geohash,
            city, 
            state, 
            tag, 
            summary, 
            evidence_present,
            is_verified,
            upvotes,
            downvotes,
            confidence,
            image_url,
            activity_type,
            num_officials,
            num_vehicles,
            uniform_description,
            source_url
        FROM public_reports 
        WHERE id = ? 
          AND visible_at <= NOW() 
          AND is_hidden = 0
        LIMIT 1
    ");
    
    $stmt->execute([$id]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$report) {
        sendError('Report not found', 404);
    }
    
    // Get user's vote for this report
    $ipHash = getClientIPHash();
    $voteStmt = $pdo->prepare("SELECT vote_type FROM report_votes WHERE report_id = ? AND ip_hash = ?");
    $voteStmt->execute([$id, $ipHash]);
    $userVote = $voteStmt->fetchColumn();
    $report['user_vote'] = $userVote ?: null;
    
    sendSuccess([
        'report' => $report
    ], 'Report retrieved successfully');
    
} catch (PDOException $e) {
    error_log("Report get error: " . $e->getMessage());
    sendError('Failed to fetch report', 500);
}
