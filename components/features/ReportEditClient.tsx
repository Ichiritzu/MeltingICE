'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { localDB, Incident, AttachmentMeta, AgencyType } from '@/lib/db/indexedDb';
import { sanitizeIncident } from '@/lib/sanitize';
import { api } from '@/lib/api';
import { QuickExitButton } from '@/components/ui/QuickExitButton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Camera, Save, Send, FileDown, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportEditClientProps {
    id: string;
}

export default function ReportEditClient({ id }: ReportEditClientProps) {
    const router = useRouter();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [posting, setPosting] = useState(false);

    // Form state
    const [datetime, setDatetime] = useState('');
    const [description, setDescription] = useState('');
    const [agency, setAgency] = useState<AgencyType>('Unknown');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        loadIncident();
    }, [id]);

    async function loadIncident() {
        const inc = await localDB.getIncident(id);
        if (!inc) {
            router.push('/report');
            return;
        }
        setIncident(inc);
        setDatetime(inc.data.datetime);
        setDescription(inc.data.description || '');
        setAgency(inc.data.agency || 'Unknown');
        setCity(inc.data.location?.city || '');
        setState(inc.data.location?.state || '');
        if (inc.data.location?.lat) {
            setLocation({ lat: inc.data.location.lat, lng: inc.data.location.lng });
        }
        setLoading(false);
    }

    async function saveIncident() {
        if (!incident) return;
        setSaving(true);
        await localDB.updateIncident(id, {
            datetime,
            description,
            agency,
            location: location ? { ...location, city, state } : { lat: 0, lng: 0, city, state },
        });
        setSaving(false);
        loadIncident();
    }

    function getLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                alert('Could not get location: ' + err.message);
            }
        );
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0 || !incident) return;

        const file = e.target.files[0];
        const isImage = file.type.startsWith('image/');

        const meta: Omit<AttachmentMeta, 'id' | 'created_at'> = {
            type: isImage ? 'image' : 'video',
            original_name: file.name,
            mime_type: file.type,
            size: file.size,
            stripped: false,
        };

        await localDB.addAttachment(id, file, meta);

        // Only update attachments in state, don't reset form values
        const updatedInc = await localDB.getIncident(id);
        if (updatedInc) {
            setIncident(updatedInc);
        }
    }

    async function postToPublic() {
        if (!incident) return;

        await saveIncident();

        const sanitized = sanitizeIncident(incident);
        if (!sanitized) {
            alert('Cannot post: Missing required information (location and description) or contains unsafe content.');
            return;
        }

        setPosting(true);
        try {
            const result = await api.createReport(sanitized);
            if (result) {
                await localDB.markAsPosted(id, result.id);
                alert(`Report posted! It will be visible after ${result.visible_at} and expires at ${result.expires_at}`);
                loadIncident();
            }
        } catch (error: any) {
            alert('Failed to post: ' + (error.message || 'Unknown error'));
        }
        setPosting(false);
    }

    function exportPDF() {
        if (!incident) return;

        const doc = new jsPDF();
        let y = 20;

        doc.setFontSize(18);
        doc.text('Incident Report', 20, y);
        y += 15;

        doc.setFontSize(10);
        doc.text(`Report ID: ${incident.id}`, 20, y);
        y += 8;
        doc.text(`Date/Time: ${new Date(incident.data.datetime).toLocaleString()}`, 20, y);
        y += 8;
        doc.text(`Agency: ${incident.data.agency || 'Unknown'}`, 20, y);
        y += 8;

        if (incident.data.location) {
            doc.text(`Location: ${incident.data.location.city || ''}, ${incident.data.location.state || ''}`, 20, y);
            y += 8;
            if (incident.data.location.lat) {
                doc.text(`Coordinates: ${incident.data.location.lat.toFixed(5)}, ${incident.data.location.lng.toFixed(5)}`, 20, y);
                y += 8;
            }
        }

        y += 10;
        doc.setFontSize(12);
        doc.text('Description:', 20, y);
        y += 8;
        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(incident.data.description || 'No description', 170);
        doc.text(descLines, 20, y);
        y += descLines.length * 5 + 10;

        if (incident.data.attachments && incident.data.attachments.length > 0) {
            doc.setFontSize(12);
            doc.text('Attachments:', 20, y);
            y += 8;
            doc.setFontSize(10);
            incident.data.attachments.forEach((att, i) => {
                doc.text(`${i + 1}. ${att.original_name} (${att.type}, ${(att.size / 1024).toFixed(1)} KB)`, 25, y);
                y += 6;
            });
        }

        y = 280;
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text('Generated by MeltingICE.app - Local report, not submitted to authorities', 20, y);

        doc.save(`incident-report-${incident.id.substring(0, 8)}.pdf`);
    }

    if (loading) {
        return <div className="min-h-screen bg-[#1a1d2e] flex items-center justify-center text-[#6b7280]">Loading...</div>;
    }

    if (!incident) return null;

    return (
        <main className="min-h-screen bg-[#1a1d2e] text-white pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#1a1d2e]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <Link href="/report">
                        <Button variant="ghost" size="sm" className="text-[#9ca3af]">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <span className="font-bold text-sm truncate max-w-[150px]">
                        {incident.status === 'draft' ? 'Draft' : 'Report'}
                    </span>
                    <QuickExitButton />
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Basic Info */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Basic Info</h2>

                    <div>
                        <label className="block text-xs text-[#6b7280] mb-1">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={datetime.substring(0, 16)}
                            onChange={(e) => setDatetime(e.target.value)}
                            className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-[#6b7280] mb-1">Agency</label>
                        <select
                            value={agency}
                            onChange={(e) => setAgency(e.target.value as AgencyType)}
                            className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                        >
                            <option value="Unknown">Unknown</option>
                            <option value="ICE">ICE</option>
                            <option value="CBP">CBP</option>
                            <option value="Police">Police</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </section>

                {/* Location */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Location</h2>

                    <Button variant="secondary" onClick={getLocation} className="w-full">
                        <MapPin className="w-4 h-4 mr-2" />
                        {location ? 'Update GPS Location' : 'Get GPS Location'}
                    </Button>

                    {location && (
                        <div className="bg-[#5dd39e]/20 border border-[#5dd39e]/20 rounded-lg p-3 text-sm text-[#5dd39e] text-center">
                            📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-[#6b7280] mb-1">City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="City"
                                className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#6b7280] mb-1">State</label>
                            <input
                                type="text"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                placeholder="State"
                                maxLength={2}
                                className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                            />
                        </div>
                    </div>
                </section>

                {/* Description */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Description</h2>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what happened... (NO personal identifiers, addresses, or license plates)"
                        rows={6}
                        className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white resize-none"
                    />
                    <p className="text-xs text-[#6b7280]">
                        ⚠️ Do not include exact addresses, phone numbers, license plates, or personal names.
                    </p>
                </section>

                {/* Attachments */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Evidence (Local Only)</h2>

                    <label className="block cursor-pointer">
                        <div className="flex items-center justify-center gap-2 w-full bg-[#242838] border border-dashed border-[#3d4358] rounded-lg px-4 py-6 text-[#9ca3af] hover:bg-zinc-800 transition-colors">
                            <Camera className="w-5 h-5" />
                            <span>Add Photo/Video</span>
                        </div>
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                    </label>

                    {incident.data.attachments && incident.data.attachments.length > 0 && (
                        <div className="space-y-2">
                            {incident.data.attachments.map((att) => (
                                <div key={att.id} className="bg-[#242838] rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{att.type === 'image' ? '📷' : '🎥'}</span>
                                        <div>
                                            <p className="text-sm text-[#f5f0eb] truncate max-w-[200px]">{att.original_name}</p>
                                            <p className="text-xs text-[#6b7280]">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="text-xs text-[#6b7280]">
                        📱 Evidence stays on your device only. Never uploaded.
                    </p>
                </section>
            </div>

            {/* Fixed Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1d2e] border-t border-white/5 px-4 py-4">
                <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
                    <Button variant="secondary" onClick={saveIncident} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                    </Button>
                    <Button variant="outline" onClick={exportPDF}>
                        <FileDown className="w-4 h-4 mr-1" /> PDF
                    </Button>
                    <Button
                        onClick={postToPublic}
                        disabled={posting || incident.posted_to_public}
                        className={incident.posted_to_public ? 'bg-[#5dd39e]' : 'bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] hover:opacity-90'}
                    >
                        {posting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : incident.posted_to_public ? (
                            <><Check className="w-4 h-4 mr-1" /> Posted</>
                        ) : (
                            <><Send className="w-4 h-4 mr-1" /> Post</>
                        )}
                    </Button>
                </div>
            </div>
        </main>
    );
}

