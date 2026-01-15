<?php
/**
 * POST /api/reports/create.php
 * Creates a new sanitized public report
 * 
 * Request body (JSON):
 * {
 *   "lat": 34.0522,           // Required, will be rounded
 *   "lng": -118.2437,         // Required, will be rounded
 *   "event_time": "2024-01-15T14:30:00Z", // Required, will be bucketed
 *   "city": "Los Angeles",    // Optional
 *   "state": "CA",            // Optional
 *   "tag": "vehicle",         // Optional, enum
 *   "summary": "...",         // Required, max 280 chars
 *   "evidence_present": true  // Optional, boolean
 * }
 */

require_once __DIR__ . '/../init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Rate limiting
if (!checkRateLimit()) {
    sendError('Rate limit exceeded. Please try again later.', 429);
}

$input = getJSONInput();

// ============================================
// VALIDATION
// ============================================

// Required fields
if (!isset($input['lat']) || !isset($input['lng'])) {
    sendError('Location (lat/lng) is required');
}

if (!isset($input['event_time'])) {
    sendError('Event time is required');
}

if (!isset($input['summary']) || empty(trim($input['summary']))) {
    sendError('Summary is required');
}

$lat = floatval($input['lat']);
$lng = floatval($input['lng']);

// Validate coordinates
if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
    sendError('Invalid coordinates');
}

// Validate summary
$summary = sanitizeText($input['summary'], 280);
if (mb_strlen($summary) < 10) {
    sendError('Summary must be at least 10 characters');
}

// Safety check
if (containsUnsafeContent($summary)) {
    sendError('Report contains potentially unsafe content. Please remove specific addresses, phone numbers, or identifying information.', 422);
}

// Optional fields
$city = isset($input['city']) ? sanitizeText($input['city'], 100) : null;
$state = isset($input['state']) ? sanitizeText($input['state'], 50) : null;
$evidencePresent = isset($input['evidence_present']) ? (bool)$input['evidence_present'] : false;
$imageUrl = isset($input['image_url']) ? filter_var($input['image_url'], FILTER_VALIDATE_URL) : null;

// Validate tag
$validTags = ['vehicle', 'checkpoint', 'detention', 'raid', 'unknown'];
$tag = in_array($input['tag'] ?? '', $validTags) ? $input['tag'] : 'unknown';

// New documentation fields
$activityType = isset($input['activity_type']) ? sanitizeText($input['activity_type'], 50) : null;
$numOfficials = isset($input['num_officials']) ? sanitizeText($input['num_officials'], 20) : null;
$numVehicles = isset($input['num_vehicles']) ? sanitizeText($input['num_vehicles'], 20) : null;
$uniformDescription = isset($input['uniform_description']) ? sanitizeText($input['uniform_description'], 255) : null;
$sourceUrl = isset($input['source_url']) ? filter_var($input['source_url'], FILTER_VALIDATE_URL) : null;
if ($sourceUrl === false) $sourceUrl = null;

// ============================================
// SANITIZATION
// ============================================

// Round coordinates to ~111m precision (3 decimal places)
$latApprox = round($lat, 3);
$lngApprox = round($lng, 3);

// Generate geohash (simplified - 6 chars = ~1.2km precision)
// For production, use a proper geohash library
$geohash = substr(md5("$latApprox,$lngApprox"), 0, 6);

// Bucket event time to 30-minute intervals
$eventTime = strtotime($input['event_time']);
if (!$eventTime) {
    sendError('Invalid event time format');
}
$bucketedMinutes = floor(date('i', $eventTime) / 30) * 30;
$eventTimeBucket = date('Y-m-d H:', $eventTime) . str_pad($bucketedMinutes, 2, '0', STR_PAD_LEFT) . ':00';

// No visibility delay - reports appear immediately
$visibleAt = date('Y-m-d H:i:s');

// No expiration - reports are permanent documentation (set to 100 years)
$expiresAt = date('Y-m-d H:i:s', strtotime('+100 years'));

// ============================================
// INSERT
// ============================================

$pdo = getDB();
$id = generateUUID();
$ipHash = getClientIPHash();

try {
    $stmt = $pdo->prepare("
        INSERT INTO public_reports 
        (id, event_time_bucket, visible_at, expires_at, lat_approx, lng_approx, geohash, city, state, tag, summary, evidence_present, image_url, ip_hash, activity_type, num_officials, num_vehicles, uniform_description, source_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $id,
        $eventTimeBucket,
        $visibleAt,
        $expiresAt,
        $latApprox,
        $lngApprox,
        $geohash,
        $city,
        $state,
        $tag,
        $summary,
        $evidencePresent ? 1 : 0,
        $imageUrl,
        $ipHash,
        $activityType,
        $numOfficials,
        $numVehicles,
        $uniformDescription,
        $sourceUrl
    ]);
    
    sendSuccess([
        'id' => $id,
        'visible_at' => $visibleAt,
        'expires_at' => $expiresAt,
        'message' => "Report posted successfully. Visible immediately."
    ], 'Report submitted successfully');
    
} catch (PDOException $e) {
    error_log("Report create error: " . $e->getMessage());
    sendError('Failed to create report', 500);
}
