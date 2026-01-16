<?php
/**
 * Community Admin Auth Helper
 * Include this in community admin endpoints to verify authentication
 * Supports both X-Admin-Key header and Bearer token
 */

require_once __DIR__ . '/../../init.php';

/**
 * Verify admin access via X-Admin-Key or Bearer token
 * @return bool True if authorized, false otherwise
 */
function verifyCommunityAdmin(): bool {
    // First, check X-Admin-Key header
    $adminKey = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
    if ($adminKey === env('ADMIN_SECRET', '')) {
        return true;
    }
    
    // Fallback: check Bearer token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        if (!empty($token)) {
            try {
                $db = getDB();
                $stmt = $db->prepare("
                    SELECT s.admin_id FROM admin_sessions s 
                    JOIN admin_users u ON s.admin_id = u.id 
                    WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1
                ");
                $stmt->execute([$token]);
                return $stmt->fetch() !== false;
            } catch (Exception $e) {
                // Token validation failed
            }
        }
    }
    
    return false;
}

/**
 * Require admin access - sends 401 and exits if not authorized
 */
function requireCommunityAdmin(): void {
    if (!verifyCommunityAdmin()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}
