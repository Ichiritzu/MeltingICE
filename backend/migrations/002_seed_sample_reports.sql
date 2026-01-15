-- MeltingICE.app Sample Data Seed Script
-- Run this in phpMyAdmin to populate the database with sample reports
-- Note: image_url is NULL for seed data - upload real photos through the app

-- Clear existing test data (optional - uncomment if you want to delete seed data first)
-- DELETE FROM public_reports WHERE id LIKE 'seed-%';

INSERT INTO public_reports 
(id, lat_approx, lng_approx, geohash, city, state, tag, summary, confidence, evidence_present, image_url, visible_at, expires_at, ip_hash, event_time_bucket)
VALUES

-- Texas Reports
('seed-tx-001', 29.760, -95.370, '9v', 'Houston', 'TX', 'vehicle', 
'White unmarked van with tinted windows observed near downtown area. Multiple individuals in uniform visible.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed123', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-tx-002', 29.424, -98.494, '9v', 'San Antonio', 'TX', 'checkpoint', 
'Immigration checkpoint reported on I-35 northbound near mile marker 145. Officers checking vehicles.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed124', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

('seed-tx-003', 32.777, -96.797, '9v', 'Dallas', 'TX', 'vehicle', 
'Two dark SUVs with federal plates spotted near downtown courthouse. Agents appeared to be conducting operation.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed125', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

('seed-tx-004', 30.267, -97.743, '9v', 'Austin', 'TX', 'vehicle', 
'Marked vehicle observed in parking lot near community center. No activity reported.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed126', DATE_SUB(NOW(), INTERVAL 12 HOUR)),

-- California Reports  
('seed-ca-001', 34.052, -118.244, '9q', 'Los Angeles', 'CA', 'raid', 
'Multiple agents reported at apartment complex in East LA. Residents advised to stay indoors.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed127', DATE_SUB(NOW(), INTERVAL 1 HOUR)),

('seed-ca-002', 32.716, -117.161, '9m', 'San Diego', 'CA', 'checkpoint', 
'Checkpoint reported on Highway 5 near Oceanside. Secondary inspection area set up.', 
'verified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed128', DATE_SUB(NOW(), INTERVAL 3 HOUR)),

('seed-ca-003', 37.775, -122.419, '9q', 'San Francisco', 'CA', 'vehicle', 
'Unmarked sedan with federal plates spotted near Mission District. Two individuals in plain clothes observed.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed129', DATE_SUB(NOW(), INTERVAL 8 HOUR)),

('seed-ca-004', 36.738, -119.787, '9q', 'Fresno', 'CA', 'detention', 
'Individual detained outside grocery store on Shaw Ave. Witnesses report agents showed badges.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed130', DATE_SUB(NOW(), INTERVAL 5 HOUR)),

-- Arizona Reports
('seed-az-001', 33.448, -112.074, '9t', 'Phoenix', 'AZ', 'vehicle', 
'White van with government plates observed near Phoenix Sky Harbor. Standard patrol activity.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed131', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-az-002', 32.223, -110.975, '9t', 'Tucson', 'AZ', 'checkpoint', 
'Checkpoint active on I-19 north of Nogales. All vehicles being stopped for inspection.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed132', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- Florida Reports
('seed-fl-001', 25.762, -80.192, 'dh', 'Miami', 'FL', 'raid', 
'Operation reported at business complex in Little Havana. Multiple vehicles on scene.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed133', DATE_SUB(NOW(), INTERVAL 3 HOUR)),

('seed-fl-002', 27.951, -82.457, 'dj', 'Tampa', 'FL', 'vehicle', 
'Marked vehicle patrol observed near Ybor City. Appeared to be routine patrol.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed134', DATE_SUB(NOW(), INTERVAL 7 HOUR)),

-- New York Reports
('seed-ny-001', 40.713, -74.006, 'dr', 'New York City', 'NY', 'detention', 
'Individual reported detained near subway station in Queens. Legal observers on scene.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed135', DATE_SUB(NOW(), INTERVAL 2 HOUR)),

('seed-ny-002', 42.886, -78.878, 'dp', 'Buffalo', 'NY', 'checkpoint', 
'Checkpoint reported near Peace Bridge crossing. Secondary screening active.', 
'verified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed136', DATE_SUB(NOW(), INTERVAL 6 HOUR)),

-- Illinois Reports
('seed-il-001', 41.878, -87.630, 'dp', 'Chicago', 'IL', 'vehicle', 
'Two unmarked vehicles observed near Pilsen neighborhood. No activity reported at this time.', 
'unverified', 0, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed137', DATE_SUB(NOW(), INTERVAL 4 HOUR)),

-- Georgia Reports
('seed-ga-001', 33.749, -84.388, 'dj', 'Atlanta', 'GA', 'raid', 
'Workplace operation reported at manufacturing facility. Multiple detentions reported by witnesses.', 
'verified', 1, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 100 YEAR), 'seed138', DATE_SUB(NOW(), INTERVAL 5 HOUR));

-- Verify insert
SELECT COUNT(*) as total_reports FROM public_reports;
