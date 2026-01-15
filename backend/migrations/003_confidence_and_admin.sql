-- Migration: Add confidence scoring, voting, and admin features
-- Run this in phpMyAdmin AFTER the initial schema

-- 1. Modify confidence column from ENUM to INT
ALTER TABLE public_reports 
MODIFY COLUMN confidence INT DEFAULT 20 COMMENT 'Confidence score 0-100';

-- 2. Add voting and moderation columns
ALTER TABLE public_reports 
ADD COLUMN upvotes INT DEFAULT 0 AFTER confidence,
ADD COLUMN downvotes INT DEFAULT 0 AFTER upvotes,
ADD COLUMN flag_count INT DEFAULT 0 AFTER downvotes,
ADD COLUMN is_hidden TINYINT(1) DEFAULT 0 AFTER flag_count,
ADD COLUMN is_verified TINYINT(1) DEFAULT 0 AFTER is_hidden,
ADD COLUMN moderated_at DATETIME DEFAULT NULL AFTER is_verified,
ADD COLUMN moderated_by VARCHAR(100) DEFAULT NULL AFTER moderated_at;

-- 3. Create votes table (tracks who voted on what)
CREATE TABLE IF NOT EXISTS report_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    vote_type ENUM('up', 'down') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (report_id, ip_hash),
    INDEX idx_report (report_id),
    FOREIGN KEY (report_id) REFERENCES public_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create flags table (tracks reported content)
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
    INDEX idx_unresolved (is_resolved),
    FOREIGN KEY (report_id) REFERENCES public_reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create admin users table
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

-- 6. Create admin sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Insert initial admin user
-- IMPORTANT: Generate your own password hash with:
-- php -r "echo password_hash('YOUR_SECURE_PASSWORD', PASSWORD_BCRYPT);"
-- Then replace the hash below with your generated hash
INSERT INTO admin_users (email, password_hash, name) VALUES 
('support@meltingice.app', 'REPLACE_WITH_YOUR_BCRYPT_HASH', 'Admin');

-- Verify
SELECT 'Migration complete!' as status;
SELECT COUNT(*) as admin_count FROM admin_users;
