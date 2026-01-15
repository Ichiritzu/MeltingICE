
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/idb';
import { Incident, IncidentStatus } from '@/types';

export function useIncident(id?: string) {
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }
        load(id);
    }, [id]);

    const load = async (incidentId: string) => {
        setLoading(true);
        const data = await db.getIncident(incidentId);
        setIncident(data || null);
        setLoading(false);
    };

    const create = async () => {
        const newId = crypto.randomUUID();
        const newIncident: Incident = {
            id: newId,
            created_at: Date.now(),
            updated_at: Date.now(),
            status: 'draft',
            data: {
                datetime: new Date().toISOString(),
            }
        };
        await db.saveIncident(newIncident);
        setIncident(newIncident);
        return newId;
    };

    const update = useCallback(async (partialData: Partial<Incident['data']>) => {
        if (!incident) return;

        const updated: Incident = {
            ...incident,
            updated_at: Date.now(),
            data: { ...incident.data, ...partialData }
        };

        setIncident(updated); // Optimistic UI
        await db.saveIncident(updated); // Async save
    }, [incident]);

    const remove = async () => {
        if (!incident) return;
        await db.deleteIncident(incident.id);
        setIncident(null);
    };

    return { incident, loading, create, update, remove };
}

export function useIncidentsList() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const list = await db.getIncidents();
        // Sort by updated_at desc
        setIncidents(list.sort((a, b) => b.updated_at - a.updated_at));
        setLoading(false);
    };

    return { incidents, loading, reload: load };
}
