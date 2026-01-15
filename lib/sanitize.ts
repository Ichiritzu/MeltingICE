/**
 * MeltingICE.app - Report Sanitization Module
 * Applies privacy-preserving transformations before public submission
 */

import type { Incident, LocationData, ReportTag } from './db/indexedDb';

export interface SanitizedReport {
    lat: number;
    lng: number;
    event_time: string;
    city?: string;
    state?: string;
    tag: ReportTag;
    summary: string;
    evidence_present: boolean;
}

// ============================================
// COORDINATE SANITIZATION
// ============================================

/**
 * Rounds coordinates to ~111m precision (3 decimal places)
 * This provides neighborhood-level accuracy without exact locations
 */
export function roundCoordinates(lat: number, lng: number): { lat: number; lng: number } {
    return {
        lat: Math.round(lat * 1000) / 1000,
        lng: Math.round(lng * 1000) / 1000,
    };
}

/**
 * Adds random jitter to coordinates (optional additional privacy)
 * Jitter is ±0.001 degrees (~111m)
 */
export function addLocationJitter(lat: number, lng: number): { lat: number; lng: number } {
    const jitter = () => (Math.random() - 0.5) * 0.002;
    return roundCoordinates(lat + jitter(), lng + jitter());
}

// ============================================
// TIME SANITIZATION
// ============================================

/**
 * Buckets time to 30-minute intervals
 * e.g., 14:47 becomes 14:30, 14:15 becomes 14:00
 */
export function bucketTime(isoString: string): string {
    const date = new Date(isoString);
    const minutes = date.getMinutes();
    const bucketedMinutes = Math.floor(minutes / 30) * 30;
    date.setMinutes(bucketedMinutes, 0, 0);
    return date.toISOString();
}

// ============================================
// TEXT SANITIZATION
// ============================================

const UNSAFE_PATTERNS = [
    /\b\d+\s+(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl|boulevard|blvd)\b/gi,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\b(apartment|apt|unit|suite|ste)\s*#?\s*\d+\b/gi, // Unit numbers
    /\b\d{5}(-\d{4})?\b/g, // ZIP codes
    /\b(license\s*plate|plate\s*#?|tag\s*#?)\s*:?\s*[A-Z0-9]{4,8}\b/gi, // License plates
];

/**
 * Removes potentially identifying information from text
 */
export function sanitizeText(text: string, maxLength: number = 280): string {
    let sanitized = text;

    // Remove unsafe patterns
    for (const pattern of UNSAFE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Truncate
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength - 3) + '...';
    }

    return sanitized;
}

/**
 * Checks if text contains potentially unsafe content
 */
export function containsUnsafeContent(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check for violence/targeting language
    const dangerousWords = ['kill', 'attack', 'shoot', 'murder', 'assault', 'hurt', 'target', 'doxx', 'dox', 'expose their'];
    if (dangerousWords.some(word => lowerText.includes(word))) {
        return true;
    }

    // Check for specific addresses (basic check)
    if (/\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|dr|drive|ln|lane)\b/i.test(text)) {
        return true;
    }

    return false;
}

// ============================================
// TAG INFERENCE
// ============================================

/**
 * Infers report tag from description keywords
 */
export function inferTag(description: string): ReportTag {
    const lower = description.toLowerCase();

    if (lower.includes('checkpoint') || lower.includes('roadblock')) return 'checkpoint';
    if (lower.includes('detention') || lower.includes('arrested') || lower.includes('detained')) return 'detention';
    if (lower.includes('raid') || lower.includes('house') || lower.includes('workplace')) return 'raid';
    if (lower.includes('vehicle') || lower.includes('car') || lower.includes('van') || lower.includes('suv')) return 'vehicle';

    return 'unknown';
}

// ============================================
// FULL SANITIZATION
// ============================================

/**
 * Converts a local incident to a sanitized public report
 */
export function sanitizeIncident(incident: Incident): SanitizedReport | null {
    // Must have location
    if (!incident.data.location?.lat || !incident.data.location?.lng) {
        console.error('Sanitization failed: Missing GPS coordinates');
        return null;
    }

    // Must have description (minimum 10 characters)
    if (!incident.data.description || incident.data.description.trim().length < 10) {
        console.error('Sanitization failed: Description must be at least 10 characters');
        return null;
    }

    // Check for unsafe content
    if (containsUnsafeContent(incident.data.description)) {
        console.error('Sanitization failed: Contains unsafe content');
        return null;
    }

    const coords = addLocationJitter(incident.data.location.lat, incident.data.location.lng);

    return {
        lat: coords.lat,
        lng: coords.lng,
        event_time: bucketTime(incident.data.datetime),
        city: incident.data.location.city,
        state: incident.data.location.state,
        tag: inferTag(incident.data.description),
        summary: sanitizeText(incident.data.description, 280),
        evidence_present: (incident.data.attachments?.length ?? 0) > 0,
    };
}

export default {
    roundCoordinates,
    addLocationJitter,
    bucketTime,
    sanitizeText,
    containsUnsafeContent,
    inferTag,
    sanitizeIncident,
};
