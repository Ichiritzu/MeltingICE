<?php
/**
 * Admin Reports List API
 * GET /api/admin/reports.php
 */

require_once __DIR__ . '/auth.php';

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

// Verify admin
$admin = requireAdmin();

try {
    $pdo = getDB();
    
    // Get filter params
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'all';
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = 20;
    $offset = ($page - 1) * $limit;

    // Base query
    $sql = "SELECT 
        r.id,
        r.event_time_bucket,
        r.city,
        r.state,
        r.tag,
        r.summary,
        r.confidence,
        r.upvotes,
        r.downvotes,
        r.flag_count,
        r.is_hidden,
        r.is_verified,
        r.evidence_present,
        r.image_url,
        r.created_at,
        r.moderated_at,
        r.moderated_by
    FROM public_reports r 
    WHERE 1=1";

    // Apply filters
    switch ($filter) {
        case 'flagged':
            $sql .= " AND r.flag_count > 0 AND r.is_hidden = 0";
            break;
        case 'hidden':
            $sql .= " AND r.is_hidden = 1";
            break;
        case 'verified':
            $sql .= " AND r.is_verified = 1";
            break;
        // 'all' - no additional filter
    }

    // Get total count
    $countSql = str_replace("SELECT \n        r.id,", "SELECT COUNT(*) as total FROM (SELECT r.id", $sql);
    $countSql = preg_replace('/SELECT.*FROM public_reports/s', 'SELECT COUNT(*) as total FROM public_reports', $sql);
    $stmt = $pdo->query($countSql);
    $total = $stmt->fetchColumn();

    // Order and paginate
    $sql .= " ORDER BY r.flag_count DESC, r.created_at DESC LIMIT $limit OFFSET $offset";

    $stmt = $pdo->query($sql);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get flags for each report (if any have flags)
    $reportIds = array_column($reports, 'id');
    $flags = [];
    
    if (!empty($reportIds)) {
        $placeholders = str_repeat('?,', count($reportIds) - 1) . '?';
        $stmt = $pdo->prepare("
            SELECT report_id, reason, created_at, is_resolved 
            FROM report_flags 
            WHERE report_id IN ($placeholders)
            ORDER BY created_at DESC
        ");
        $stmt->execute($reportIds);
        
        while ($flag = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $flags[$flag['report_id']][] = $flag;
        }
    }

    // Attach flags to reports
    foreach ($reports as &$report) {
        $report['flags'] = $flags[$report['id']] ?? [];
    }

    sendSuccess([
        'reports' => $reports,
        'total' => (int)$total,
        'page' => $page,
        'pages' => ceil($total / $limit),
        'filter' => $filter,
    ]);

} catch (PDOException $e) {
    error_log('Admin reports error: ' . $e->getMessage());
    sendError('Database error', 500);
}
