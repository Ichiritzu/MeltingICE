<?php
/**
 * POST /api/uploads/image.php
 * Uploads an image, strips EXIF, converts to WebP, and returns the URL
 * 
 * Request: multipart/form-data with 'image' field
 * Returns: { success: true, data: { url: "..." } }
 */

require_once __DIR__ . '/../init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Rate limiting
if (!checkRateLimit()) {
    sendError('Rate limit exceeded. Please try again later.', 429);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
        UPLOAD_ERR_PARTIAL => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Server misconfigured',
        UPLOAD_ERR_CANT_WRITE => 'Cannot write to disk',
    ];
    $code = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
    sendError($errorMessages[$code] ?? 'Upload failed', 400);
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    sendError('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed.', 400);
}

// Max size: 10MB
$maxSize = 10 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    sendError('File too large. Maximum 10MB.', 400);
}

// Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '/../../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$id = bin2hex(random_bytes(16));
$outputPath = $uploadDir . $id . '.webp';

// Load image based on type
switch ($mimeType) {
    case 'image/jpeg':
        $image = imagecreatefromjpeg($file['tmp_name']);
        break;
    case 'image/png':
        $image = imagecreatefrompng($file['tmp_name']);
        // Preserve transparency
        imagealphablending($image, true);
        imagesavealpha($image, true);
        break;
    case 'image/gif':
        $image = imagecreatefromgif($file['tmp_name']);
        break;
    case 'image/webp':
        $image = imagecreatefromwebp($file['tmp_name']);
        break;
    default:
        sendError('Unsupported image format', 400);
}

if (!$image) {
    sendError('Failed to process image', 500);
}

// Resize if too large (max 1920px on longest side)
$width = imagesx($image);
$height = imagesy($image);
$maxDimension = 1920;

if ($width > $maxDimension || $height > $maxDimension) {
    if ($width > $height) {
        $newWidth = $maxDimension;
        $newHeight = (int)($height * ($maxDimension / $width));
    } else {
        $newHeight = $maxDimension;
        $newWidth = (int)($width * ($maxDimension / $height));
    }
    
    $resized = imagecreatetruecolor($newWidth, $newHeight);
    
    // Preserve transparency for PNG
    imagealphablending($resized, false);
    imagesavealpha($resized, true);
    
    imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    imagedestroy($image);
    $image = $resized;
}

// Convert to WebP (strips EXIF automatically since we're re-encoding)
// Quality 80 is a good balance of size and quality
$success = imagewebp($image, $outputPath, 80);
imagedestroy($image);

if (!$success) {
    sendError('Failed to save image', 500);
}

// Get file size
$fileSize = filesize($outputPath);

// Generate public URL
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
$baseUrl .= '://' . $_SERVER['HTTP_HOST'];
$imageUrl = $baseUrl . '/uploads/' . $id . '.webp';

sendSuccess([
    'id' => $id,
    'url' => $imageUrl,
    'size' => $fileSize,
    'format' => 'webp'
], 'Image uploaded successfully');
