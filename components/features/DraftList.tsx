
'use client';

import { useIncidentsList } from "@/hooks/useIncident";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2, ChevronRight, FileClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/idb";

export function DraftList() {
    const { incidents, loading, reload } = useIncidentsList();
    const router = useRouter();

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-500" /></div>;
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this draft?")) return;
        await db.deleteIncident(id);
        reload();
    };

    return (
        <div className="space-y-4">
            {incidents.length === 0 ? (
                <div className="text-center py-16 rounded-3xl border border-dashed border-white/10 bg-white/5">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileClock className="w-8 h-8 text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 font-medium">No reports yet.</p>
                    <p className="text-zinc-600 text-xs mt-1">Start a new one above.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {incidents.map((incident) => (
                        <div
                            key={incident.id}
                            onClick={() => router.push(`/report/edit?id=${incident.id}`)}
                            className="group cursor-pointer relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/5 p-4 hover:bg-zinc-800/60 hover:border-blue-500/30 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-zinc-100 group-hover:text-blue-200 transition-colors">
                                        {incident.data.description ? incident.data.description.substring(0, 30) + (incident.data.description.length > 30 ? '...' : '') : "Untitled Incident"}
                                    </h3>
                                    <div className="flex gap-2 text-xs text-zinc-500 font-mono uppercase tracking-wide">
                                        <span>{new Date(incident.data.datetime).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="text-blue-400">{incident.status}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                        onClick={(e) => handleDelete(e, incident.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
