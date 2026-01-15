<?php
/**
 * GET /api/resources/list.php
 * Returns resources by category (KYR cards, agencies, hotlines, templates)
 * 
 * Query params:
 * - category (string, optional: 'kyr', 'agency', 'template', 'hotline', 'legal_aid')
 */

require_once __DIR__ . '/../init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$pdo = getDB();

$category = isset($_GET['category']) ? sanitizeText($_GET['category'], 50) : null;

$sql = "SELECT id, category, title, content, metadata, sort_order 
        FROM resources 
        WHERE is_active = 1";

$params = [];

if ($category) {
    $validCategories = ['kyr', 'agency', 'template', 'hotline', 'legal_aid'];
    if (!in_array($category, $validCategories)) {
        sendError('Invalid category');
    }
    $sql .= " AND category = ?";
    $params[] = $category;
}

$sql .= " ORDER BY category, sort_order, title";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $resources = $stmt->fetchAll();
    
    // Parse JSON metadata
    foreach ($resources as &$resource) {
        if ($resource['metadata']) {
            $resource['metadata'] = json_decode($resource['metadata'], true);
        }
    }
    
    // Group by category if no specific category requested
    if (!$category) {
        $grouped = [];
        foreach ($resources as $resource) {
            $cat = $resource['category'];
            if (!isset($grouped[$cat])) {
                $grouped[$cat] = [];
            }
            $grouped[$cat][] = $resource;
        }
        sendSuccess($grouped);
    } else {
        sendSuccess($resources);
    }
    
} catch (PDOException $e) {
    error_log("Resources list error: " . $e->getMessage());
    sendError('Failed to fetch resources', 500);
}
