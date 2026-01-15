-- Run this to seed donation organizations if they weren't inserted with the migration
-- This uses INSERT IGNORE to skip duplicates if they already exist

INSERT IGNORE INTO community_donations (name, description, link, category, status) VALUES
('RAICES Texas', 'Provides free and low-cost legal services to immigrant children and families.', 'https://www.raicestexas.org/donate/', 'legal', 'approved'),
('National Immigrant Justice Center', 'Dedicated to ensuring human rights protections and access to justice for all immigrants.', 'https://immigrantjustice.org/donate', 'legal', 'approved'),
('United We Dream', 'The largest immigrant youth-led community in the country fighting for dignity and justice.', 'https://unitedwedream.org/donate/', 'advocacy', 'approved'),
('National Bail Fund Network', 'Community bail funds that free people from jails and immigration detention centers.', 'https://www.communityjusticeexchange.org/nbfn-directory', 'bail', 'approved'),
('Immigrant Families Together', 'Reunites families separated at the border by posting bond and providing reunification support.', 'https://immigrantfamiliestogether.com/', 'mutual_aid', 'approved'),
('American Immigration Lawyers Association', 'Supports legal advocacy and provides resources for immigrants seeking legal help.', 'https://www.aila.org/', 'legal', 'approved');

-- Verify the data was inserted
SELECT id, name, category, status FROM community_donations;
