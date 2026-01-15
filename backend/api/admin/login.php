<?php
/**
 * Admin Login API
 * POST /api/admin/login.php
 */

require_once __DIR__ . '/../init.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendError('Invalid JSON input', 400);
}

$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validate
if (empty($email) || empty($password)) {
    sendError('Email and password are required', 400);
}

try {
    $pdo = getDB();
    
    // Find user by email
    $stmt = $pdo->prepare("SELECT id, email, password_hash, name, is_active FROM admin_users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Generic error to prevent email enumeration
        sendError('Invalid credentials', 401);
    }

    if (!$user['is_active']) {
        sendError('Account is disabled', 403);
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        sendError('Invalid credentials', 401);
    }

    // Create session token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Store session
    $stmt = $pdo->prepare("INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $token, $expiresAt]);

    // Update last login
    $stmt = $pdo->prepare("UPDATE admin_users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);

    sendSuccess([
        'token' => $token,
        'expires_at' => $expiresAt,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
        ],
    ], 'Login successful');

} catch (PDOException $e) {
    error_log('Admin login error: ' . $e->getMessage());
    sendError('Database error', 500);
}
