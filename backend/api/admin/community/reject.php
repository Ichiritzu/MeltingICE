<?php
/**
 * POST /api/admin/community/reject.php
 * Reject a pending community item
 * Requires admin secret key
 */

require_once __DIR__ . '/../../init.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check admin key
$adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if ($adminKey !== getenv('ADMIN_SECRET')) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['type']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing type or id']);
    exit;
}

$type = $input['type'];
$id = (int)$input['id'];

if (!in_array($type, ['event', 'donation'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit;
}

try {
    $db = getDB();
    
    $table = $type === 'event' ? 'community_events' : 'community_donations';
    $stmt = $db->prepare("UPDATE $table SET status = 'rejected' WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Item not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => ucfirst($type) . ' rejected'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to reject item']);
}
