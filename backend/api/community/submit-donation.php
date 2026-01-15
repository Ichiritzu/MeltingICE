<?php
/**
 * POST /api/community/submit-donation.php
 * Submit a new donation organization for approval
 */

require_once __DIR__ . '/../init.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['name', 'description', 'link', 'email'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Validate URL
if (!filter_var($input['link'], FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid donation link URL']);
    exit;
}

// Validate category
$validCategories = ['legal', 'mutual_aid', 'advocacy', 'bail', 'general'];
$category = isset($input['category']) && in_array($input['category'], $validCategories) 
    ? $input['category'] 
    : 'general';

// Sanitize inputs
$name = htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars(trim($input['description']), ENT_QUOTES, 'UTF-8');
$link = filter_var($input['link'], FILTER_SANITIZE_URL);
$image_url = isset($input['image_url']) ? filter_var($input['image_url'], FILTER_SANITIZE_URL) : null;
$email = filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL);

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// Validate lengths
if (strlen($name) > 255) {
    http_response_code(400);
    echo json_encode(['error' => 'Name must be under 255 characters']);
    exit;
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        INSERT INTO community_donations 
        (name, description, link, image_url, category, submitter_email, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    $stmt->execute([
        $name,
        $description,
        $link,
        $image_url,
        $category,
        $email
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Organization submitted for review. It will appear after approval.',
        'id' => $db->lastInsertId()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to submit organization']);
}
