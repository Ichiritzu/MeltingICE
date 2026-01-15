<?php
/**
 * MeltingICE.app - API Initialization
 * Include this file at the top of all API endpoints
 */

// ============================================
// 1. ERROR HANDLING
// ============================================
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't expose errors to client
ini_set('log_errors', 1);

// ============================================
// 2. HEADERS (JSON + CORS + NO CACHE)
// ============================================
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Prevent Varnish/CDN caching of API responses
header('Cache-Control: no-cache, no-store, must-revalidate, private');
header('Pragma: no-cache');
header('Expires: 0');

// CORS - Your domains
$allowed_origins = [
    'https://meltingice.app',
    'https://www.meltingice.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ============================================
// 3. DATABASE CONNECTION
// ============================================
// IMPORTANT: Set these environment variables on your server
// DB_HOST, DB_NAME, DB_USER, DB_PASS must be configured
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: '');
define('DB_USER', getenv('DB_USER') ?: '');
define('DB_PASS', getenv('DB_PASS') ?: '');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            sendError('Database connection failed', 500);
        }
    }
    return $pdo;
}

// ============================================
// 4. HELPER FUNCTIONS
// ============================================
function sendJSON($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(string $message, int $code = 400): void {
    sendJSON(['success' => false, 'error' => $message], $code);
}

function sendSuccess($data = null, string $message = 'OK'): void {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJSON($response);
}

function getClientIPHash(): string {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    // Take first IP if multiple
    $ip = explode(',', $ip)[0];
    return hash('sha256', trim($ip) . 'meltingice_salt_v1');
}

function getJSONInput(): array {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON input', 400);
    }
    return $data ?? [];
}

function generateUUID(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// ============================================
// 5. RATE LIMITING
// ============================================
define('RATE_LIMIT_MAX', 10); // Max requests per window
define('RATE_LIMIT_WINDOW', 3600); // Window in seconds (1 hour)

function checkRateLimit(): bool {
    $pdo = getDB();
    $ipHash = getClientIPHash();
    $now = time();
    $windowStart = date('Y-m-d H:i:s', $now - RATE_LIMIT_WINDOW);
    
    // Clean old entries
    $pdo->exec("DELETE FROM rate_limits WHERE window_start < '$windowStart'");
    
    // Check current count
    $stmt = $pdo->prepare("SELECT request_count, window_start FROM rate_limits WHERE ip_hash = ?");
    $stmt->execute([$ipHash]);
    $row = $stmt->fetch();
    
    if (!$row) {
        // First request
        $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_hash, request_count, window_start) VALUES (?, 1, NOW())");
        $stmt->execute([$ipHash]);
        return true;
    }
    
    if ($row['request_count'] >= RATE_LIMIT_MAX) {
        return false; // Rate limited
    }
    
    // Increment count
    $stmt = $pdo->prepare("UPDATE rate_limits SET request_count = request_count + 1 WHERE ip_hash = ?");
    $stmt->execute([$ipHash]);
    return true;
}

// ============================================
// 6. CONTENT FILTERING (Safety)
// ============================================
function containsUnsafeContent(string $text): bool {
    $unsafePatterns = [
        '/\b\d+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl)\b/i', // Street addresses
        '/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/', // Phone numbers
        '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/', // Emails
        '/\b(apartment|apt|unit|suite|ste)\s*#?\s*\d+\b/i', // Unit numbers
        '/\b\d{5}(-\d{4})?\b/', // ZIP codes (we allow city but not exact ZIP in reports)
        '/\b(kill|attack|shoot|murder|assault|hurt)\b/i', // Violence
        '/\b(doxx|dox|expose|identify|find\s+them)\b/i', // Doxxing language
    ];
    
    foreach ($unsafePatterns as $pattern) {
        if (preg_match($pattern, $text)) {
            return true;
        }
    }
    return false;
}

function sanitizeText(string $text, int $maxLength = 280): string {
    // Strip HTML
    $text = strip_tags($text);
    // Normalize whitespace
    $text = preg_replace('/\s+/', ' ', trim($text));
    // Truncate
    if (mb_strlen($text) > $maxLength) {
        $text = mb_substr($text, 0, $maxLength - 3) . '...';
    }
    return $text;
}
