<?php
/**
 * GET /api/reports/list.php
 * Returns sanitized public reports that are past their delay window
 * 
 * Query params:
 * - limit (int, default 50, max 100)
 * - offset (int, default 0)
 * - city (string, optional filter)
 * - state (string, optional filter)
 */

require_once __DIR__ . '/../init.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$pdo = getDB();

// Parse query params
$limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
$offset = max(0, intval($_GET['offset'] ?? 0));
$city = isset($_GET['city']) ? sanitizeText($_GET['city'], 100) : null;
$state = isset($_GET['state']) ? sanitizeText($_GET['state'], 50) : null;

// Build query - only show visible, non-hidden reports
$sql = "SELECT 
    id,
    event_time_bucket,
    visible_at,
    lat_approx,
    lng_approx,
    geohash,
    city,
    state,
    tag,
    summary,
    confidence,
    upvotes,
    downvotes,
    is_verified,
    evidence_present,
    image_url
FROM public_reports 
WHERE visible_at <= NOW() AND is_hidden = 0";

$params = [];

if ($city) {
    $sql .= " AND city LIKE ?";
    $params[] = "%$city%";
}

if ($state) {
    $sql .= " AND state = ?";
    $params[] = $state;
}

$sql .= " ORDER BY event_time_bucket DESC LIMIT ? OFFSET ?";
$params[] = $limit;
$params[] = $offset;

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reports = $stmt->fetchAll();
    
    // Get user's votes for these reports
    $ipHash = getClientIPHash();
    if (count($reports) > 0) {
        $reportIds = array_column($reports, 'id');
        $placeholders = implode(',', array_fill(0, count($reportIds), '?'));
        $voteStmt = $pdo->prepare("SELECT report_id, vote_type FROM report_votes WHERE ip_hash = ? AND report_id IN ($placeholders)");
        $voteStmt->execute(array_merge([$ipHash], $reportIds));
        $userVotes = [];
        while ($row = $voteStmt->fetch()) {
            $userVotes[$row['report_id']] = $row['vote_type'];
        }
        
        // Add user_vote to each report
        foreach ($reports as &$report) {
            $report['user_vote'] = $userVotes[$report['id']] ?? null;
        }
        unset($report);
    }
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) FROM public_reports WHERE visible_at <= NOW()";
    $countParams = [];
    
    if ($city) {
        $countSql .= " AND city LIKE ?";
        $countParams[] = "%$city%";
    }
    if ($state) {
        $countSql .= " AND state = ?";
        $countParams[] = $state;
    }
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $total = $countStmt->fetchColumn();
    
    sendSuccess([
        'reports' => $reports,
        'pagination' => [
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset,
            'has_more' => ($offset + $limit) < $total
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Reports list error: " . $e->getMessage());
    sendError('Failed to fetch reports', 500);
}
