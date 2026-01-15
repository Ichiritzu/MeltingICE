<?php
/**
 * POST /api/admin/community/approve.php
 * Approve a pending community item and send email notification
 * Requires admin secret key
 */

require_once __DIR__ . '/../../init.php';
require_once __DIR__ . '/../../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

$type = $input['type']; // 'event' or 'donation'
$id = (int)$input['id'];

if (!in_array($type, ['event', 'donation'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type']);
    exit;
}

try {
    $db = getDB();
    
    // Get item details including email
    $table = $type === 'event' ? 'community_events' : 'community_donations';
    $nameField = $type === 'event' ? 'title' : 'name';
    
    $stmt = $db->prepare("SELECT $nameField as item_name, submitter_email FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        http_response_code(404);
        echo json_encode(['error' => 'Item not found']);
        exit;
    }
    
    // Update status to approved
    $updateStmt = $db->prepare("UPDATE $table SET status = 'approved' WHERE id = ?");
    $updateStmt->execute([$id]);
    
    // Send email notification if email exists
    $emailSent = false;
    if (!empty($item['submitter_email'])) {
        $emailSent = sendApprovalEmail($item['submitter_email'], $item['item_name'], $type);
    }
    
    echo json_encode([
        'success' => true,
        'message' => ucfirst($type) . ' approved successfully',
        'email_sent' => $emailSent
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to approve item']);
}

/**
 * Send approval notification email
 */
function sendApprovalEmail($toEmail, $itemName, $type) {
    $typeLabel = $type === 'event' ? 'event' : 'organization';
    
    $emailBody = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2 style='margin:0'>Your Submission Was Approved! ✓</h2>
            </div>
            <div class='content'>
                <p>Great news! Your $typeLabel submission has been approved and is now live on MeltingICE.</p>
                
                <p><strong>$itemName</strong></p>
                
                <p>Thank you for contributing to the community. Your submission is helping others find resources and stay connected.</p>
                
                <a href='https://meltingice.app/community' class='button'>View on MeltingICE</a>
                
                <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                    — The MeltingICE Team<br>
                    <a href='https://meltingice.app'>meltingice.app</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    ";

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
        $mail->setFrom('support@meltingice.app', 'MeltingICE');
        $mail->addAddress($toEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = "Your submission was approved! - MeltingICE";
        $mail->Body    = $emailBody;
        $mail->AltBody = "Your $typeLabel submission \"$itemName\" has been approved and is now live on MeltingICE. View it at https://meltingice.app/community";

        $mail->send();
        return true;
        
    } catch (Exception $e) {
        error_log("Approval email failed: " . $mail->ErrorInfo);
        return false;
    }
}
