-- MeltingICE.app Database Schema
-- MySQL/MariaDB compatible
-- Run this on your Cloudways MySQL database

-- ============================================
-- 1. PUBLIC REPORTS (sanitized, server-stored)
-- ============================================
CREATE TABLE IF NOT EXISTS public_reports (
    id VARCHAR(36) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_time_bucket DATETIME NOT NULL COMMENT 'Rounded to 30-min intervals',
    visible_at DATETIME NOT NULL COMMENT 'When report becomes visible (created_at + delay)',
    expires_at DATETIME NOT NULL COMMENT 'Auto-delete after this time',
    lat_approx DECIMAL(6,3) NOT NULL COMMENT 'Rounded to ~111m precision',
    lng_approx DECIMAL(6,3) NOT NULL COMMENT 'Rounded to ~111m precision',
    geohash VARCHAR(6) DEFAULT NULL COMMENT 'Alternative to lat/lng, 6 chars = ~1.2km',
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(50) DEFAULT NULL,
    tag ENUM('vehicle', 'checkpoint', 'detention', 'raid', 'unknown') DEFAULT 'unknown',
    summary VARCHAR(280) NOT NULL COMMENT 'Max 280 chars, sanitized',
    confidence ENUM('unverified', 'verified') DEFAULT 'unverified',
    evidence_present TINYINT(1) DEFAULT 0 COMMENT 'Boolean: user had evidence locally',
    ip_hash VARCHAR(64) NOT NULL COMMENT 'SHA256 of IP for rate limiting, never stored raw',
    INDEX idx_visible_at (visible_at),
    INDEX idx_expires_at (expires_at),
    INDEX idx_geohash (geohash),
    INDEX idx_city_state (city, state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. RATE LIMITING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash VARCHAR(64) PRIMARY KEY,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. RESOURCES (KYR cards, agencies, templates)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('kyr', 'agency', 'template', 'hotline', 'legal_aid') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSON DEFAULT NULL COMMENT 'Extra fields like phone, url, etc',
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SEED DATA: KYR CARDS
-- ============================================
INSERT INTO resources (category, title, content, metadata, sort_order) VALUES
('kyr', 'Right to Remain Silent', 'You have the right to remain silent. Say: "I am exercising my right to remain silent."', '{"script": "I am exercising my right to remain silent.", "icon": "volume-x"}', 1),
('kyr', 'Right to Refuse Search', 'You do not have to consent to a search of yourself, your car, or your home. Say: "I do not consent to a search."', '{"script": "I do not consent to a search.", "icon": "shield"}', 2),
('kyr', 'Right to Leave', 'If you are not under arrest, you have the right to calmly leave. Ask: "Am I free to leave?"', '{"script": "Am I free to leave?", "icon": "door-open"}', 3),
('kyr', 'Right to Attorney', 'If you are arrested, you have the right to a lawyer. Say: "I want to speak to a lawyer."', '{"script": "I want to speak to a lawyer.", "icon": "scale"}', 4),
('kyr', 'Do Not Sign', 'Do not sign anything you do not understand. You have the right to have documents explained.', '{"script": "I will not sign anything without understanding it.", "icon": "file-x"}', 5),
('kyr', 'Do Not Lie', 'Do not provide false documents or lie about your citizenship status. Remain silent instead.', '{"script": null, "icon": "alert-triangle"}', 6);

-- ============================================
-- 5. SEED DATA: AGENCIES
-- ============================================
INSERT INTO resources (category, title, content, metadata, sort_order) VALUES
('agency', 'DHS Office for Civil Rights and Civil Liberties', 'File complaints about ICE/CBP misconduct.', '{"url": "https://www.dhs.gov/file-civil-rights-complaint", "phone": "866-644-8360", "type": "oversight"}', 1),
('agency', 'DHS TRIP (Traveler Redress)', 'For issues at borders, airports, or incorrect watchlist flags.', '{"url": "https://www.dhs.gov/dhs-trip", "phone": null, "type": "redress"}', 2),
('agency', 'ICE Detention Reporting and Information Line', 'To locate someone in ICE detention.', '{"url": null, "phone": "888-351-4024", "type": "detention"}', 3),
('agency', 'ACLU Immigrants Rights Project', 'Legal resources and advocacy.', '{"url": "https://www.aclu.org/issues/immigrants-rights", "phone": null, "type": "legal"}', 4),
('agency', 'National Immigration Law Center', 'Policy advocacy and legal support.', '{"url": "https://www.nilc.org", "phone": null, "type": "legal"}', 5);

-- ============================================
-- 6. SEED DATA: HOTLINES
-- ============================================
INSERT INTO resources (category, title, content, metadata, sort_order) VALUES
('hotline', 'United We Dream - MigraWatch', 'Report ICE activity and get rapid response support.', '{"phone": "844-363-1423", "url": "https://unitedwedream.org", "available": "24/7"}', 1),
('hotline', 'National Immigrant Justice Center', 'Legal assistance for immigrants.', '{"phone": "312-660-1370", "url": "https://immigrantjustice.org", "available": "Business hours"}', 2),
('hotline', 'RAICES Texas', 'Legal services in Texas.', '{"phone": "210-787-3180", "url": "https://www.raicestexas.org", "available": "Business hours"}', 3);

-- ============================================
-- 7. SEED DATA: COMPLAINT TEMPLATES
-- ============================================
INSERT INTO resources (category, title, content, metadata, sort_order) VALUES
('template', 'CRCL Complaint Template', 'I am writing to file a civil rights complaint regarding an incident that occurred on [DATE] at approximately [TIME] in [CITY, STATE].\n\nAgency involved: [ICE/CBP]\n\nDescription of incident:\n[Describe what happened, including any badge numbers, vehicle descriptions, and witness information]\n\nI believe my rights were violated because:\n[Explain which rights you believe were violated]\n\nI request that your office investigate this matter and take appropriate action.\n\nSincerely,\n[Your name - optional]', '{"agency": "DHS CRCL", "format": "email"}', 1),
('template', 'Congressional Representative Letter', 'Dear [Representative/Senator Name],\n\nI am a constituent writing to report concerning immigration enforcement activity in our community.\n\nOn [DATE], [describe incident briefly].\n\nI urge you to:\n1. Investigate this incident\n2. Support policies that protect community members\n3. Ensure accountability for enforcement agencies\n\nThank you for your attention to this matter.\n\nSincerely,\n[Your name]\n[Your address]', '{"agency": "Congress", "format": "letter"}', 2);

-- ============================================
-- 8. CLEANUP EVENT (auto-expire reports)
-- ============================================
-- Run this as a scheduled event or cron job
-- DELETE FROM public_reports WHERE expires_at < NOW();
