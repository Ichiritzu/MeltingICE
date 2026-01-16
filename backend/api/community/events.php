<?php
/**
 * GET /api/community/events.php
 * Returns list of approved community events
 */

require_once __DIR__ . '/../init.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = getDB();
    
    // Get approved events, ordered by event date (upcoming first)
    $stmt = $db->prepare("
        SELECT 
            id, title, description, event_date, event_time, 
            location, organizer, link, created_at
        FROM community_events 
        WHERE status = 'approved' 
        AND event_date >= DATE_SUB(CURDATE(), INTERVAL 2 DAY)
        ORDER BY event_date ASC
    ");
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'events' => $events
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch events']);
}
