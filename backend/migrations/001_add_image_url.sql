-- Add image_url column to public_reports
-- Run this in phpMyAdmin if the table already exists

ALTER TABLE public_reports 
ADD COLUMN image_url VARCHAR(500) DEFAULT NULL COMMENT 'URL to uploaded WebP image'
AFTER evidence_present;
