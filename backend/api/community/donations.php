<?php
/**
 * GET /api/community/donations.php
 * Returns list of approved donation organizations
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
    
    // Check if table exists
    $tableCheck = $db->query("SHOW TABLES LIKE 'community_donations'");
    if ($tableCheck->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(['error' => 'Table community_donations does not exist. Run the migration first.']);
        exit;
    }
    
    // Get approved donations
    $stmt = $db->prepare("
        SELECT 
            id, name, description, link, image_url, category, created_at
        FROM community_donations 
        WHERE status = 'approved' 
        ORDER BY created_at DESC
    ");
    $stmt->execute();
    $donations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'donations' => $donations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch donations',
        'debug' => $e->getMessage()
    ]);
}
