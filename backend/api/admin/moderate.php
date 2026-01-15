<?php
/**
 * Admin Moderation API
 * POST /api/admin/moderate.php
 */

require_once __DIR__ . '/auth.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Verify admin
$admin = requireAdmin();

// Get input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError('Invalid JSON input', 400);
}

$reportId = isset($input['report_id']) ? $input['report_id'] : '';
$action = isset($input['action']) ? $input['action'] : '';

// Validate
if (empty($reportId) || empty($action)) {
    sendError('Report ID and action are required', 400);
}

$validActions = ['hide', 'unhide', 'verify', 'unverify', 'delete', 'resolve_flags'];
if (!in_array($action, $validActions)) {
    sendError('Invalid action. Valid: ' . implode(', ', $validActions), 400);
}

try {
    $pdo = getDB();
    
    // Check report exists
    $stmt = $pdo->prepare("SELECT id FROM public_reports WHERE id = ?");
    $stmt->execute([$reportId]);
    if (!$stmt->fetch()) {
        sendError('Report not found', 404);
    }

    $now = date('Y-m-d H:i:s');
    $adminEmail = $admin['email'];

    switch ($action) {
        case 'hide':
            $stmt = $pdo->prepare("UPDATE public_reports SET is_hidden = 1, moderated_at = ?, moderated_by = ? WHERE id = ?");
            $stmt->execute([$now, $adminEmail, $reportId]);
            $message = 'Report hidden';
            break;

        case 'unhide':
            $stmt = $pdo->prepare("UPDATE public_reports SET is_hidden = 0, moderated_at = ?, moderated_by = ? WHERE id = ?");
            $stmt->execute([$now, $adminEmail, $reportId]);
            $message = 'Report unhidden';
            break;

        case 'verify':
            // Recalculate confidence with +20 for verified
            $stmt = $pdo->prepare("
                UPDATE public_reports 
                SET is_verified = 1, 
                    confidence = LEAST(100, confidence + 20),
                    moderated_at = ?, 
                    moderated_by = ? 
                WHERE id = ?
            ");
            $stmt->execute([$now, $adminEmail, $reportId]);
            $message = 'Report verified';
            break;

        case 'unverify':
            $stmt = $pdo->prepare("
                UPDATE public_reports 
                SET is_verified = 0, 
                    confidence = GREATEST(0, confidence - 20),
                    moderated_at = ?, 
                    moderated_by = ? 
                WHERE id = ?
            ");
            $stmt->execute([$now, $adminEmail, $reportId]);
            $message = 'Report unverified';
            break;

        case 'delete':
            // Soft delete by hiding and marking
            $stmt = $pdo->prepare("DELETE FROM public_reports WHERE id = ?");
            $stmt->execute([$reportId]);
            $message = 'Report deleted';
            break;

        case 'resolve_flags':
            $stmt = $pdo->prepare("
                UPDATE report_flags 
                SET is_resolved = 1, resolved_at = ?, resolved_by = ? 
                WHERE report_id = ? AND is_resolved = 0
            ");
            $stmt->execute([$now, $adminEmail, $reportId]);
            
            // Reset flag count
            $stmt = $pdo->prepare("UPDATE public_reports SET flag_count = 0, moderated_at = ?, moderated_by = ? WHERE id = ?");
            $stmt->execute([$now, $adminEmail, $reportId]);
            $message = 'Flags resolved';
            break;
    }

    // Log action
    error_log("Admin action: $adminEmail performed '$action' on report $reportId");

    sendSuccess(['action' => $action, 'report_id' => $reportId], $message);

} catch (PDOException $e) {
    error_log('Admin moderate error: ' . $e->getMessage());
    sendError('Database error', 500);
}
