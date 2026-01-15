<?php
/**
 * Community Inquiry Submission Endpoint
 * Sends inquiry emails via PHPMailer with ProtonMail SMTP
 */

require_once __DIR__ . '/../init.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['name', 'email', 'title', 'description', 'type'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Sanitize inputs
$name = htmlspecialchars(strip_tags($input['name']));
$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$type = $input['type'] === 'donation' ? 'Donation/Organization' : 'Protest/Event';
$title = htmlspecialchars(strip_tags($input['title']));
$description = htmlspecialchars(strip_tags($input['description']));
$date = isset($input['date']) ? htmlspecialchars(strip_tags($input['date'])) : 'Not specified';
$location = isset($input['location']) ? htmlspecialchars(strip_tags($input['location'])) : 'Not specified';
$link = isset($input['link']) ? filter_var($input['link'], FILTER_SANITIZE_URL) : 'Not provided';

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// Build email body
$emailBody = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; }
        .value { margin-top: 5px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2 style='margin:0'>New Community Submission</h2>
            <p style='margin:10px 0 0 0;opacity:0.9'>Type: $type</p>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Submitted By:</div>
                <div class='value'>$name ($email)</div>
            </div>
            <div class='field'>
                <div class='label'>Title:</div>
                <div class='value'>$title</div>
            </div>
            <div class='field'>
                <div class='label'>Description:</div>
                <div class='value'>$description</div>
            </div>
            <div class='field'>
                <div class='label'>Date:</div>
                <div class='value'>$date</div>
            </div>
            <div class='field'>
                <div class='label'>Location:</div>
                <div class='value'>$location</div>
            </div>
            <div class='field'>
                <div class='label'>Link:</div>
                <div class='value'><a href='$link'>$link</a></div>
            </div>
        </div>
    </div>
</body>
</html>
";

// Create PHPMailer instance
$mail = new PHPMailer(true);

try {
    // SMTP Configuration for ProtonMail
    $mail->isSMTP();
    $mail->Host       = 'smtp.protonmail.ch';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'support@meltingice.app';
    $mail->Password   = getenv('SMTP_PASSWORD'); // Set SMTP_PASSWORD env var
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // Recipients
    $mail->setFrom('support@meltingice.app', 'MeltingICE Community');
    $mail->addAddress('support@meltingice.app', 'MeltingICE Support');
    $mail->addReplyTo($email, $name);

    // Content
    $mail->isHTML(true);
    $mail->Subject = "[Community Submission] $type: $title";
    $mail->Body    = $emailBody;
    $mail->AltBody = "New community submission:\n\nType: $type\nFrom: $name ($email)\nTitle: $title\nDescription: $description\nDate: $date\nLocation: $location\nLink: $link";

    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Submission received! We will review it soon.'
    ]);

} catch (Exception $e) {
    error_log("PHPMailer Error: " . $mail->ErrorInfo);
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to send email. Please try again later.',
        'debug' => $mail->ErrorInfo // Remove in production
    ]);
}
