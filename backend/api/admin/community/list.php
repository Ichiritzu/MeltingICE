<?php
/**
 * GET /api/admin/community/list.php
 * List all community items (events and donations) for admin review
 * Supports both X-Admin-Key header and Bearer token authentication
 */

require_once __DIR__ . '/auth_helper.php';

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verify admin access
requireCommunityAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$type = $_GET['type'] ?? 'all'; // 'events', 'donations', or 'all'
$status = $_GET['status'] ?? 'all'; // 'pending', 'approved', 'rejected', or 'all'

try {
    $db = getDB();
    $result = [];
    
    // Get events
    if ($type === 'all' || $type === 'events') {
        $sql = "SELECT id, 'event' as type, title as name, description, event_date, event_time, location, organizer, link, status, created_at FROM community_events";
        if ($status !== 'all') {
            $sql .= " WHERE status = ?";
        }
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        if ($status !== 'all') {
            $stmt->execute([$status]);
        } else {
            $stmt->execute();
        }
        $result['events'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Get donations
    if ($type === 'all' || $type === 'donations') {
        $sql = "SELECT id, 'donation' as type, name, description, link, image_url, category, status, created_at FROM community_donations";
        if ($status !== 'all') {
            $sql .= " WHERE status = ?";
        }
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        if ($status !== 'all') {
            $stmt->execute([$status]);
        } else {
            $stmt->execute();
        }
        $result['donations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Count pending items
    $stmtPending = $db->query("
        SELECT 
            (SELECT COUNT(*) FROM community_events WHERE status = 'pending') as pending_events,
            (SELECT COUNT(*) FROM community_donations WHERE status = 'pending') as pending_donations
    ");
    $counts = $stmtPending->fetch(PDO::FETCH_ASSOC);
    $result['pending_count'] = [
        'events' => (int)$counts['pending_events'],
        'donations' => (int)$counts['pending_donations'],
        'total' => (int)$counts['pending_events'] + (int)$counts['pending_donations']
    ];
    
    echo json_encode(['success' => true, ...$result]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch items']);
}
