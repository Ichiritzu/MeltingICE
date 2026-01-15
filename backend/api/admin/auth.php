<?php
/**
 * Admin Auth Helper
 * Include this in admin endpoints to verify authentication
 */

require_once __DIR__ . '/../init.php';

/**
 * Verify admin token and return admin user data
 * @return array|null Admin user data or null if invalid
 */
function verifyAdminToken(): ?array {
    $pdo = getDB();
    
    // Get token from Authorization header
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // PHP 7 compatible check for "Bearer " prefix
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($authHeader, 7);
    
    if (empty($token)) {
        return null;
    }
    
    try {
        // Find valid session
        $stmt = $pdo->prepare("
            SELECT s.*, u.email, u.name, u.is_active 
            FROM admin_sessions s 
            JOIN admin_users u ON s.admin_id = u.id 
            WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = 1
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$session) {
            return null;
        }
        
        return [
            'id' => $session['admin_id'],
            'email' => $session['email'],
            'name' => $session['name'],
        ];
        
    } catch (PDOException $e) {
        error_log('Admin auth error: ' . $e->getMessage());
        return null;
    }
}

/**
 * Require admin authentication - sends error if not authenticated
 * @return array Admin user data
 */
function requireAdmin(): array {
    $admin = verifyAdminToken();
    
    if (!$admin) {
        sendError('Unauthorized', 401);
        exit;
    }
    
    return $admin;
}
