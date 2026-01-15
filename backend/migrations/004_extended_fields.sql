-- Migration: Add extended documentation fields to public_reports
-- Run this on your Cloudways MySQL database

ALTER TABLE public_reports
    ADD COLUMN activity_type VARCHAR(50) DEFAULT NULL COMMENT 'vehicle, checkpoint, raid, detention, warning, other',
    ADD COLUMN num_officials VARCHAR(20) DEFAULT NULL COMMENT 'Number of officials or "unknown"',
    ADD COLUMN num_vehicles VARCHAR(20) DEFAULT NULL COMMENT 'Number of vehicles or "unknown"',
    ADD COLUMN uniform_description VARCHAR(255) DEFAULT NULL COMMENT 'Description of uniforms',
    ADD COLUMN source_url TEXT DEFAULT NULL COMMENT 'Optional source link (social media, news)';
