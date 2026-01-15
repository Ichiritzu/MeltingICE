<?php
/**
 * POST /api/community/submit-event.php
 * Submit a new community event for approval
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
$required = ['title', 'description', 'event_date', 'location', 'email'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Validate date format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['event_date'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid date format. Use YYYY-MM-DD']);
    exit;
}

// Sanitize inputs
$title = htmlspecialchars(trim($input['title']), ENT_QUOTES, 'UTF-8');
$description = htmlspecialchars(trim($input['description']), ENT_QUOTES, 'UTF-8');
$event_date = $input['event_date'];
$event_time = isset($input['event_time']) ? htmlspecialchars(trim($input['event_time']), ENT_QUOTES, 'UTF-8') : null;
$location = htmlspecialchars(trim($input['location']), ENT_QUOTES, 'UTF-8');
$organizer = isset($input['organizer']) ? htmlspecialchars(trim($input['organizer']), ENT_QUOTES, 'UTF-8') : null;
$link = isset($input['link']) ? filter_var($input['link'], FILTER_SANITIZE_URL) : null;
$email = filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL);

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// Validate lengths
if (strlen($title) > 255 || strlen($location) > 255) {
    http_response_code(400);
    echo json_encode(['error' => 'Title and location must be under 255 characters']);
    exit;
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        INSERT INTO community_events 
        (title, description, event_date, event_time, location, organizer, link, submitter_email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    
    $stmt->execute([
        $title,
        $description,
        $event_date,
        $event_time,
        $location,
        $organizer,
        $link,
        $email
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Event submitted for review. It will appear after approval.',
        'id' => $db->lastInsertId()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to submit event']);
}
