/**
 * MeltingICE.app - IndexedDB Local Storage Module
 * Handles local-first incident vault with attachments
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type IncidentStatus = 'draft' | 'finalized';
export type AgencyType = 'ICE' | 'CBP' | 'Police' | 'Other' | 'Unknown';
export type AttachmentType = 'image' | 'video' | 'audio';
export type ReportTag = 'vehicle' | 'checkpoint' | 'detention' | 'raid' | 'unknown';

export interface LocationData {
    lat: number;
    lng: number;
    accuracy?: number;
    address_manual?: string;
    city?: string;
    state?: string;
}

export interface Witness {
    id: string;
    name?: string;
    contact_safe?: string;
    notes?: string;
}

export interface AttachmentMeta {
    id: string;
    type: AttachmentType;
    original_name: string;
    mime_type: string;
    size: number;
    stripped: boolean;
    sha256_hash?: string;
    created_at: number;
}

export interface Incident {
    id: string;
    created_at: number;
    updated_at: number;
    status: IncidentStatus;
    data: {
        datetime: string;
        location?: LocationData;
        description?: string;
        agency?: AgencyType;

        // Detailed documentation fields
        activity_type?: 'vehicle' | 'checkpoint' | 'raid' | 'detention' | 'warning' | 'other';
        num_officials?: number | 'unknown';
        num_vehicles?: number | 'unknown';
        uniform_description?: string;  // "Marked vests", "Plain clothes", etc.
        source_url?: string;  // Optional link to social media/news

        witnesses?: Witness[];
        attachments?: AttachmentMeta[];
    };
    posted_to_public?: boolean;
    public_report_id?: string;
}

export interface AttachmentData {
    id: string;
    incident_id: string;
    blob: Blob;
    type: AttachmentType;
    created_at: number;
}

export interface AppSettings {
    key: string;
    value: unknown;
}

// ============================================
// DATABASE SCHEMA
// ============================================

interface MeltingIceDB extends DBSchema {
    incidents: {
        key: string;
        value: Incident;
        indexes: { 'by-date': number; 'by-status': IncidentStatus };
    };
    attachments: {
        key: string;
        value: AttachmentData;
        indexes: { 'by-incident': string };
    };
    settings: {
        key: string;
        value: AppSettings;
    };
}

const DB_NAME = 'meltingice-vault';
const DB_VERSION = 1;

// ============================================
// DATABASE INITIALIZATION
// ============================================

let dbPromise: Promise<IDBPDatabase<MeltingIceDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MeltingIceDB>> {
    if (!dbPromise) {
        dbPromise = openDB<MeltingIceDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Incidents store
                if (!db.objectStoreNames.contains('incidents')) {
                    const incidentStore = db.createObjectStore('incidents', { keyPath: 'id' });
                    incidentStore.createIndex('by-date', 'created_at');
                    incidentStore.createIndex('by-status', 'status');
                }

                // Attachments store (blobs)
                if (!db.objectStoreNames.contains('attachments')) {
                    const attachmentStore = db.createObjectStore('attachments', { keyPath: 'id' });
                    attachmentStore.createIndex('by-incident', 'incident_id');
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            },
        });
    }
    return dbPromise;
}

// ============================================
// INCIDENT OPERATIONS
// ============================================

export const localDB = {
    // --- Incidents ---
    async createIncident(): Promise<Incident> {
        const db = await getDB();
        const now = Date.now();
        const incident: Incident = {
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
            status: 'draft',
            data: {
                datetime: new Date().toISOString(),
            },
        };
        await db.put('incidents', incident);
        return incident;
    },

    async getIncident(id: string): Promise<Incident | undefined> {
        const db = await getDB();
        return db.get('incidents', id);
    },

    async updateIncident(id: string, updates: Partial<Incident['data']>): Promise<Incident | null> {
        const db = await getDB();
        const incident = await db.get('incidents', id);
        if (!incident) return null;

        incident.data = { ...incident.data, ...updates };
        incident.updated_at = Date.now();
        await db.put('incidents', incident);
        return incident;
    },

    async setIncidentStatus(id: string, status: IncidentStatus): Promise<void> {
        const db = await getDB();
        const incident = await db.get('incidents', id);
        if (incident) {
            incident.status = status;
            incident.updated_at = Date.now();
            await db.put('incidents', incident);
        }
    },

    async markAsPosted(id: string, publicReportId: string): Promise<void> {
        const db = await getDB();
        const incident = await db.get('incidents', id);
        if (incident) {
            incident.posted_to_public = true;
            incident.public_report_id = publicReportId;
            incident.updated_at = Date.now();
            await db.put('incidents', incident);
        }
    },

    async getAllIncidents(): Promise<Incident[]> {
        const db = await getDB();
        const incidents = await db.getAllFromIndex('incidents', 'by-date');
        return incidents.reverse(); // Newest first
    },

    async getDraftIncidents(): Promise<Incident[]> {
        const db = await getDB();
        return db.getAllFromIndex('incidents', 'by-status', 'draft');
    },

    async deleteIncident(id: string): Promise<void> {
        const db = await getDB();
        // Delete attachments first
        const attachments = await db.getAllFromIndex('attachments', 'by-incident', id);
        const tx = db.transaction(['incidents', 'attachments'], 'readwrite');
        for (const att of attachments) {
            await tx.objectStore('attachments').delete(att.id);
        }
        await tx.objectStore('incidents').delete(id);
        await tx.done;
    },

    // --- Attachments ---
    async addAttachment(incidentId: string, blob: Blob, meta: Omit<AttachmentMeta, 'id' | 'created_at'>): Promise<AttachmentMeta> {
        const db = await getDB();
        const id = crypto.randomUUID();
        const now = Date.now();

        const attachmentMeta: AttachmentMeta = {
            ...meta,
            id,
            created_at: now,
        };

        const attachmentData: AttachmentData = {
            id,
            incident_id: incidentId,
            blob,
            type: meta.type,
            created_at: now,
        };

        // Store blob
        await db.put('attachments', attachmentData);

        // Update incident with metadata
        const incident = await db.get('incidents', incidentId);
        if (incident) {
            const attachments = incident.data.attachments || [];
            attachments.push(attachmentMeta);
            incident.data.attachments = attachments;
            incident.updated_at = now;
            await db.put('incidents', incident);
        }

        return attachmentMeta;
    },

    async getAttachment(id: string): Promise<AttachmentData | undefined> {
        const db = await getDB();
        return db.get('attachments', id);
    },

    async getAttachmentsForIncident(incidentId: string): Promise<AttachmentData[]> {
        const db = await getDB();
        return db.getAllFromIndex('attachments', 'by-incident', incidentId);
    },

    async deleteAttachment(id: string, incidentId: string): Promise<void> {
        const db = await getDB();

        // Remove from attachments store
        await db.delete('attachments', id);

        // Update incident metadata
        const incident = await db.get('incidents', incidentId);
        if (incident && incident.data.attachments) {
            incident.data.attachments = incident.data.attachments.filter(a => a.id !== id);
            incident.updated_at = Date.now();
            await db.put('incidents', incident);
        }
    },

    // --- Settings ---
    async getSetting<T>(key: string): Promise<T | undefined> {
        const db = await getDB();
        const setting = await db.get('settings', key);
        return setting?.value as T | undefined;
    },

    async setSetting(key: string, value: unknown): Promise<void> {
        const db = await getDB();
        await db.put('settings', { key, value });
    },

    async deleteSetting(key: string): Promise<void> {
        const db = await getDB();
        await db.delete('settings', key);
    },

    // --- Wipe All ---
    async deleteEverything(): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(['incidents', 'attachments', 'settings'], 'readwrite');
        await tx.objectStore('incidents').clear();
        await tx.objectStore('attachments').clear();
        await tx.objectStore('settings').clear();
        await tx.done;
    },

    // --- Export All ---
    async exportAllData(): Promise<{ incidents: Incident[]; settings: AppSettings[] }> {
        const db = await getDB();
        const incidents = await db.getAll('incidents');
        const settings = await db.getAll('settings');
        // Note: Not exporting blobs for size reasons
        return { incidents, settings };
    },
};

export default localDB;
