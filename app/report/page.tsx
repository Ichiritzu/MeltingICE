'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { localDB, Incident } from '@/lib/db/indexedDb';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Trash2, ChevronRight, MapPin } from 'lucide-react';

export default function ReportPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadIncidents();
    }, []);

    async function loadIncidents() {
        const all = await localDB.getAllIncidents();
        setIncidents(all);
        setLoading(false);
    }

    async function createNew() {
        const incident = await localDB.createIncident();
        router.push(`/report/edit?id=${incident.id}`);
    }

    async function deleteIncident(id: string) {
        if (!confirm('Delete this draft? This cannot be undone.')) return;
        await localDB.deleteIncident(id);
        loadIncidents();
    }

    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent">
                <FileText className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Report</span> Activity
                </h1>
                <p className="text-[#9ca3af] max-w-md mx-auto text-sm">
                    Submit anonymous reports and document incidents privately.
                </p>
            </section>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Info Card */}
                <div className="bg-orange-400/10 border border-orange-400/20 rounded-2xl p-4">
                    <h2 className="font-bold text-orange-400 mb-2">🔒 Local-First Privacy</h2>
                    <p className="text-sm text-[#9ca3af]">
                        All incident data is stored only on your device.
                        You choose when (and if) to share a sanitized version publicly.
                    </p>
                </div>

                {/* Create New Button */}
                <Button
                    onClick={createNew}
                    className="w-full h-16 text-lg bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] hover:opacity-90 text-white shadow-lg shadow-[#ff7b5f]/20"
                >
                    <Plus className="w-6 h-6 mr-2" /> New Incident Report
                </Button>

                {/* Drafts List */}
                <section>
                    <h3 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
                        Your Drafts
                    </h3>

                    {loading ? (
                        <div className="text-center py-8 text-[#9ca3af]">Loading...</div>
                    ) : incidents.length === 0 ? (
                        <div className="text-center py-12 text-[#9ca3af] bg-[#242838] rounded-2xl border border-white/5">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No incident reports yet.</p>
                            <p className="text-xs mt-1 text-[#6b7280]">Create one to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {incidents.map((inc) => (
                                <div
                                    key={inc.id}
                                    className="bg-[#242838] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-[#ff7b5f]/30 transition-colors"
                                >
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => router.push(`/report/edit?id=${inc.id}`)}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-lg ${inc.status === 'draft' ? 'bg-[#ffb347]/20 text-[#ffb347]' : 'bg-[#5dd39e]/20 text-[#5dd39e]'
                                                }`}>
                                                {inc.status}
                                            </span>
                                            {inc.posted_to_public && (
                                                <span className="text-xs text-[#5ecfcf]">📤 Posted</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-[#f5f0eb] truncate">
                                            {inc.data.description?.substring(0, 50) || 'Untitled incident'}
                                        </p>
                                        <p className="text-xs text-[#9ca3af] flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {inc.data.location?.city || 'No location'} · {new Date(inc.data.datetime).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-[#6b7280] hover:text-[#e85d75]"
                                        onClick={() => deleteIncident(inc.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <ChevronRight className="w-5 h-5 text-[#6b7280]" />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
