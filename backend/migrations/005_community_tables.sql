-- Community Events Table (protests, vigils, workshops, marches)
CREATE TABLE IF NOT EXISTS community_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(20),
    location VARCHAR(255) NOT NULL,
    organizer VARCHAR(255),
    link VARCHAR(500),
    submitter_email VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_event_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Community Donations Table (organizations to donate to)
CREATE TABLE IF NOT EXISTS community_donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    link VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    category ENUM('legal', 'mutual_aid', 'advocacy', 'bail', 'general') DEFAULT 'general',
    submitter_email VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed real donation organizations (pre-approved)
-- Using INSERT IGNORE in case migration runs multiple times (requires UNIQUE constraint to work)
INSERT IGNORE INTO community_donations (name, description, link, category, status) VALUES
('RAICES Texas', 'Provides free and low-cost legal services to immigrant children and families.', 'https://www.raicestexas.org/donate/', 'legal', 'approved'),
('National Immigrant Justice Center', 'Dedicated to ensuring human rights protections and access to justice for all immigrants.', 'https://immigrantjustice.org/donate', 'legal', 'approved'),
('United We Dream', 'The largest immigrant youth-led community in the country fighting for dignity and justice.', 'https://unitedwedream.org/donate/', 'advocacy', 'approved'),
('National Bail Fund Network', 'Community bail funds that free people from jails and immigration detention centers.', 'https://www.communityjusticeexchange.org/nbfn-directory', 'bail', 'approved'),
('Immigrant Families Together', 'Reunites families separated at the border by posting bond and providing reunification support.', 'https://immigrantfamiliestogether.com/', 'mutual_aid', 'approved'),
('American Immigration Lawyers Association', 'Supports legal advocacy and provides resources for immigrants seeking legal help.', 'https://www.aila.org/', 'legal', 'approved');
