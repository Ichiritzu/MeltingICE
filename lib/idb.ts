
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Incident, AttachmentData } from '@/types';

interface IceGuardianDB extends DBSchema {
    incidents: {
        key: string;
        value: Incident;
        indexes: { 'by-date': number };
    };
    attachments: {
        key: string;
        value: AttachmentData;
        indexes: { 'by-incident': string };
    };
    settings: {
        key: string;
        value: unknown;
    };
}

const DB_NAME = 'guardian-db';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<IceGuardianDB>> => {
    return openDB<IceGuardianDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('incidents')) {
                const store = db.createObjectStore('incidents', { keyPath: 'id' });
                store.createIndex('by-date', 'created_at');
            }
            if (!db.objectStoreNames.contains('attachments')) {
                const store = db.createObjectStore('attachments', { keyPath: 'id' });
                store.createIndex('by-incident', 'incident_id');
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        },
    });
};

export const db = {
    async getIncident(id: string) {
        const db = await initDB();
        return db.get('incidents', id);
    },
    async saveIncident(incident: Incident) {
        const db = await initDB();
        return db.put('incidents', incident);
    },
    async deleteIncident(id: string) {
        const db = await initDB();
        return db.delete('incidents', id);
    },
    async getIncidents() {
        const db = await initDB();
        return db.getAllFromIndex('incidents', 'by-date');
    },
    async addAttachment(data: AttachmentData) {
        const db = await initDB();
        return db.put('attachments', data);
    },
    async getAttachmentsForIncident(incidentId: string) {
        const db = await initDB();
        return db.getAllFromIndex('attachments', 'by-incident', incidentId);
    },
    async getSetting<T>(key: string) {
        const db = await initDB();
        return db.get('settings', key) as Promise<T | undefined>;
    },
    async setSetting(key: string, value: unknown) {
        const db = await initDB();
        return db.put('settings', { key, value });
    },
    async deleteEverything() {
        const db = await initDB();
        await db.clear('incidents');
        await db.clear('attachments');
        await db.clear('settings');
    }
};
