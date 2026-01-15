-- =====================================================
-- MeltingICE.app - Complete Update Migration
-- Run this AFTER you've already run schema.sql
-- =====================================================

-- 1. Add image_url column (from migration 001)
ALTER TABLE public_reports 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL COMMENT 'URL to uploaded WebP image'
AFTER evidence_present;

-- 2. Modify confidence column from ENUM to INT (drop constraint first if needed)
-- Note: This might fail if confidence is already INT, that's OK
ALTER TABLE public_reports 
MODIFY COLUMN confidence INT DEFAULT 20 COMMENT 'Confidence score 0-100';

-- 3. Add voting and moderation columns
ALTER TABLE public_reports 
ADD COLUMN IF NOT EXISTS upvotes INT DEFAULT 0 AFTER confidence,
ADD COLUMN IF NOT EXISTS downvotes INT DEFAULT 0 AFTER upvotes,
ADD COLUMN IF NOT EXISTS flag_count INT DEFAULT 0 AFTER downvotes,
ADD COLUMN IF NOT EXISTS is_hidden TINYINT(1) DEFAULT 0 AFTER flag_count,
ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0 AFTER is_hidden,
ADD COLUMN IF NOT EXISTS moderated_at DATETIME DEFAULT NULL AFTER is_verified,
ADD COLUMN IF NOT EXISTS moderated_by VARCHAR(100) DEFAULT NULL AFTER moderated_at;

-- 4. Create votes table
CREATE TABLE IF NOT EXISTS report_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (report_id, ip_hash),
    INDEX idx_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create flags table
CREATE TABLE IF NOT EXISTS report_flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    reason ENUM('spam', 'false_info', 'harassment', 'personal_info', 'other') NOT NULL,
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_resolved TINYINT(1) DEFAULT 0,
    resolved_at DATETIME DEFAULT NULL,
    resolved_by VARCHAR(100) DEFAULT NULL,
    UNIQUE KEY unique_flag (report_id, ip_hash),
    INDEX idx_report (report_id),
    INDEX idx_unresolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Insert admin user (if not exists)
-- IMPORTANT: Generate your own password hash with:
-- php -r "echo password_hash('YOUR_SECURE_PASSWORD', PASSWORD_BCRYPT);"
INSERT IGNORE INTO admin_users (email, password_hash, name) VALUES 
('support@meltingice.app', 'REPLACE_WITH_YOUR_BCRYPT_HASH', 'Admin');

-- =====================================================
-- SAMPLE REPORTS DATA
-- =====================================================

-- Clear old seed data first
DELETE FROM public_reports WHERE id LIKE 'seed-%';

-- Insert sample reports with new schema
INSERT INTO public_reports 
(id, lat_approx, lng_approx, geohash, city, state, tag, summary, confidence, upvotes, downvotes, is_verified, evidence_present, image_url, is_hidden, visible_at, expires_at, ip_hash, event_time_bucket)
VALUES

-- Texas Reports
('seed-tx-001', 29.760, -95.370, '9v', 'Houston', 'TX', 'vehicle', 
'White unmarked van with tinted windows observed near downtown area. Multiple individuals in uniform visible.', 
35, 2, 0, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed123', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-tx-002', 29.424, -98.494, '9v', 'San Antonio', 'TX', 'checkpoint', 
'Immigration checkpoint reported on I-35 northbound near mile marker 145. Officers checking vehicles.', 
75, 8, 1, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed124', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

('seed-tx-003', 32.777, -96.797, '9v', 'Dallas', 'TX', 'vehicle', 
'Two dark SUVs with federal plates spotted near downtown courthouse. Agents appeared to be conducting operation.', 
40, 3, 1, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed125', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

('seed-tx-004', 30.267, -97.743, '9v', 'Austin', 'TX', 'vehicle', 
'Marked vehicle observed in parking lot near community center. No activity reported.', 
25, 1, 2, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed126', DATE_SUB(NOW(), INTERVAL 12 HOUR)),

-- California Reports  
('seed-ca-001', 34.052, -118.244, '9q', 'Los Angeles', 'CA', 'raid', 
'Multiple agents reported at apartment complex in East LA. Residents advised to stay indoors.', 
85, 15, 0, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed127', DATE_SUB(NOW(), INTERVAL 1 HOUR)),

('seed-ca-002', 32.716, -117.161, '9m', 'San Diego', 'CA', 'checkpoint', 
'Checkpoint reported on Highway 5 near Oceanside. Secondary inspection area set up.', 
70, 6, 0, 1, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed128', DATE_SUB(NOW(), INTERVAL 3 HOUR)),

('seed-ca-003', 37.775, -122.419, '9q', 'San Francisco', 'CA', 'vehicle', 
'Unmarked sedan with federal plates spotted near Mission District. Two individuals in plain clothes observed.', 
35, 2, 1, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed129', DATE_SUB(NOW(), INTERVAL 8 HOUR)),

('seed-ca-004', 36.738, -119.787, '9q', 'Fresno', 'CA', 'detention', 
'Individual detained outside grocery store on Shaw Ave. Witnesses report agents showed badges.', 
80, 10, 1, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed130', DATE_SUB(NOW(), INTERVAL 5 HOUR)),

-- Arizona Reports
('seed-az-001', 33.448, -112.074, '9t', 'Phoenix', 'AZ', 'vehicle', 
'White van with government plates observed near Phoenix Sky Harbor. Standard patrol activity.', 
20, 0, 1, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed131', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-az-002', 32.223, -110.975, '9t', 'Tucson', 'AZ', 'checkpoint', 
'Checkpoint active on I-19 north of Nogales. All vehicles being stopped for inspection.', 
90, 12, 0, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed132', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- Florida Reports
('seed-fl-001', 25.762, -80.192, 'dh', 'Miami', 'FL', 'raid', 
'Operation reported at business complex in Little Havana. Multiple vehicles on scene.', 
75, 9, 1, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed133', DATE_SUB(NOW(), INTERVAL 3 HOUR)),

('seed-fl-002', 27.951, -82.457, 'dj', 'Tampa', 'FL', 'vehicle', 
'Marked vehicle patrol observed near Ybor City. Appeared to be routine patrol.', 
25, 1, 0, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed134', DATE_SUB(NOW(), INTERVAL 7 HOUR)),

-- New York Reports
('seed-ny-001', 40.713, -74.006, 'dr', 'New York City', 'NY', 'detention', 
'Individual reported detained near subway station in Queens. Legal observers on scene.', 
85, 14, 2, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed135', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-ny-002', 42.886, -78.878, 'dp', 'Buffalo', 'NY', 'checkpoint', 
'Checkpoint reported near Peace Bridge crossing. Secondary screening active.', 
65, 5, 0, 1, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed136', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- Illinois Reports
('seed-il-001', 41.878, -87.630, 'dp', 'Chicago', 'IL', 'vehicle', 
'Two unmarked vehicles observed near Pilsen neighborhood. No activity reported at this time.', 
30, 2, 1, 0, 0, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed137', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- Georgia Reports
('seed-ga-001', 33.749, -84.388, 'dj', 'Atlanta', 'GA', 'raid', 
'Workplace operation reported at manufacturing facility. Multiple detentions reported by witnesses.', 
80, 11, 1, 1, 1, NULL, 0, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed138', DATE_SUB(NOW(), INTERVAL 5 HOUR));

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'Migration complete!' as status;
SELECT COUNT(*) as total_reports FROM public_reports;
SELECT COUNT(*) as admin_users FROM admin_users;
