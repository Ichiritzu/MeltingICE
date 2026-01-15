'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { localDB, Incident, AttachmentMeta, AgencyType } from '@/lib/db/indexedDb';
import { sanitizeIncident } from '@/lib/sanitize';
import { api } from '@/lib/api';
import { QuickExitButton } from '@/components/ui/QuickExitButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/ToastProvider';
import { US_STATES, getCitiesForState } from '@/lib/locations';
import { ArrowLeft, MapPin, Camera, Save, Send, FileDown, Check, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Suspense } from 'react';

function ReportEditContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const toast = useToast();

    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [posting, setPosting] = useState(false);

    // Form state
    const [datetime, setDatetime] = useState('');
    const [description, setDescription] = useState('');
    const [agency, setAgency] = useState<AgencyType>('Unknown');
    const [city, setCity] = useState('');
    const [state, setState_] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [stateSearch, setStateSearch] = useState('');

    // New documentation fields
    const [activityType, setActivityType] = useState<string>('');
    const [numOfficials, setNumOfficials] = useState<string>('');
    const [numVehicles, setNumVehicles] = useState<string>('');
    const [uniformDescription, setUniformDescription] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');

    // Filter states based on search
    const filteredStates = useMemo(() => {
        if (!stateSearch) return US_STATES;
        const search = stateSearch.toLowerCase();
        return US_STATES.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.code.toLowerCase().includes(search)
        );
    }, [stateSearch]);

    // Filter cities based on state and typed text
    const filteredCities = useMemo(() => {
        if (!state) return [];
        const cities = getCitiesForState(state);
        if (!city) return cities;
        const search = city.toLowerCase();
        return cities.filter(c => c.toLowerCase().includes(search));
    }, [state, city]);

    useEffect(() => {
        if (id) {
            loadIncident();
        } else {
            setLoading(false);
        }
    }, [id]);

    async function loadIncident() {
        if (!id) return;
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
        setState_(inc.data.location?.state || '');
        if (inc.data.location?.lat) {
            setLocation({ lat: inc.data.location.lat, lng: inc.data.location.lng });
        }
        // Load new documentation fields
        setActivityType(inc.data.activity_type || '');
        setNumOfficials(inc.data.num_officials?.toString() || '');
        setNumVehicles(inc.data.num_vehicles?.toString() || '');
        setUniformDescription(inc.data.uniform_description || '');
        setSourceUrl(inc.data.source_url || '');
        setLoading(false);
    }

    async function saveIncident() {
        if (!incident || !id) return;
        setSaving(true);
        await localDB.updateIncident(id, {
            datetime,
            description,
            agency,
            location: location ? { ...location, city, state: state } : { lat: 0, lng: 0, city, state: state },
            // New documentation fields
            activity_type: activityType as any || undefined,
            num_officials: numOfficials === 'unknown' ? 'unknown' : (numOfficials ? parseInt(numOfficials) : undefined),
            num_vehicles: numVehicles === 'unknown' ? 'unknown' : (numVehicles ? parseInt(numVehicles) : undefined),
            uniform_description: uniformDescription || undefined,
            source_url: sourceUrl || undefined,
        });
        setSaving(false);
        // Don't reload - preserves current form state
        toast.success('Saved!');
    }

    function getLocation() {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported on this device');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                toast.success('GPS location captured');
            },
            (err) => {
                toast.error('Could not get location: ' + err.message);
            }
        );
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0 || !incident || !id) return;

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
        toast.success('Photo added!');
    }

    async function postToPublic() {
        if (!incident || !id) return;

        await saveIncident();

        // Reload to get latest saved data
        const freshIncident = await localDB.getIncident(id);
        if (!freshIncident) return;

        // Pre-validation with specific error messages
        if (!freshIncident.data.location?.lat || !freshIncident.data.location?.lng) {
            toast.error('Please click "Get GPS Location" first');
            return;
        }

        const descLength = (freshIncident.data.description || '').trim().length;
        if (descLength < 10) {
            toast.error(`Description must be at least 10 characters (currently ${descLength})`);
            return;
        }

        const sanitized = sanitizeIncident(freshIncident);
        if (!sanitized) {
            toast.error('Description may contain unsafe content (addresses, phone numbers, etc)');
            return;
        }

        setPosting(true);
        try {
            // Upload image if available
            let imageUrl: string | undefined;
            if (freshIncident.data.attachments && freshIncident.data.attachments.length > 0) {
                const firstAttachment = freshIncident.data.attachments[0];
                // Only upload images, not videos (for now)
                if (firstAttachment.type === 'image') {
                    const attachmentData = await localDB.getAttachment(firstAttachment.id);
                    if (attachmentData?.blob) {
                        const uploadResult = await api.uploadImage(attachmentData.blob);
                        if (uploadResult) {
                            imageUrl = uploadResult.url;
                        }
                    }
                }
            }

            const result = await api.createReport({
                ...sanitized,
                image_url: imageUrl,
            });
            if (result) {
                await localDB.markAsPosted(id, result.id);
                toast.success('Report posted successfully!');
                loadIncident();
            }
        } catch (error: any) {
            toast.error('Failed to post: ' + (error.message || 'Unknown error'));
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

    if (!id) {
        return (
            <div className="min-h-screen bg-[#1a1d2e] flex items-center justify-center text-[#6b7280]">
                No report ID specified. <Link href="/report" className="text-[#5ecfcf] ml-2">Go back</Link>
            </div>
        );
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
                    <div className="w-20" />{/* Spacer to balance header */}
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Local Edit Notice for Posted Reports */}
                {incident.posted_to_public && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                        <p className="text-sm text-blue-400">
                            ℹ️ <strong>Local Copy Only</strong> — Changes here update your local record but won&apos;t change the public listing.
                        </p>
                    </div>
                )}

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
                            <label className="block text-xs text-[#6b7280] mb-1">State</label>
                            <input
                                type="text"
                                list="states-list"
                                value={state}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Check if it's a valid state code or name
                                    const matchedState = US_STATES.find(s =>
                                        s.code.toLowerCase() === val.toLowerCase() ||
                                        s.name.toLowerCase() === val.toLowerCase()
                                    );
                                    if (matchedState) {
                                        setState_(matchedState.code);
                                    } else {
                                        setState_(val);
                                    }
                                }}
                                placeholder="Type or select..."
                                className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white focus:border-[#5ecfcf] focus:outline-none"
                            />
                            <datalist id="states-list">
                                {US_STATES.map((s) => (
                                    <option key={s.code} value={s.code}>{s.name}</option>
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs text-[#6b7280] mb-1">City</label>
                            <input
                                type="text"
                                list="cities-list"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder={state ? "Type or select..." : "Select state first"}
                                disabled={!state}
                                className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white focus:border-[#5ecfcf] focus:outline-none disabled:opacity-50"
                            />
                            <datalist id="cities-list">
                                {state && getCitiesForState(state).map((c) => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </section>

                {/* Documentation Details */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Documentation Details</h2>

                    <div>
                        <label className="block text-xs text-[#6b7280] mb-1">Activity Type</label>
                        <select
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value)}
                            className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                        >
                            <option value="">Select Activity...</option>
                            <option value="vehicle">🚗 Vehicle Sighting</option>
                            <option value="checkpoint">🚧 Checkpoint</option>
                            <option value="raid">🏠 Raid</option>
                            <option value="detention">👮 Detention/Arrest</option>
                            <option value="warning">⚠️ Warning/BOLO</option>
                            <option value="other">📋 Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-[#6b7280] mb-1">Number of Officials</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={numOfficials === 'unknown' ? '' : numOfficials}
                                    onChange={(e) => setNumOfficials(e.target.value)}
                                    disabled={numOfficials === 'unknown'}
                                    placeholder="0"
                                    className="flex-1 bg-[#242838] border border-[#3d4358] rounded-lg px-3 py-3 text-white disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    title="Mark as unknown"
                                    onClick={() => setNumOfficials(numOfficials === 'unknown' ? '' : 'unknown')}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${numOfficials === 'unknown'
                                        ? 'bg-[#5ecfcf] text-black'
                                        : 'bg-[#242838] border border-[#3d4358] text-[#9ca3af] hover:bg-zinc-700'
                                        }`}
                                >
                                    ?
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-[#6b7280] mb-1">Number of Vehicles</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={numVehicles === 'unknown' ? '' : numVehicles}
                                    onChange={(e) => setNumVehicles(e.target.value)}
                                    disabled={numVehicles === 'unknown'}
                                    placeholder="0"
                                    className="flex-1 bg-[#242838] border border-[#3d4358] rounded-lg px-3 py-3 text-white disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    title="Mark as unknown"
                                    onClick={() => setNumVehicles(numVehicles === 'unknown' ? '' : 'unknown')}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${numVehicles === 'unknown'
                                        ? 'bg-[#5ecfcf] text-black'
                                        : 'bg-[#242838] border border-[#3d4358] text-[#9ca3af] hover:bg-zinc-700'
                                        }`}
                                >
                                    ?
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-[#6b7280] mb-1">Uniform Description</label>
                        <input
                            type="text"
                            value={uniformDescription}
                            onChange={(e) => setUniformDescription(e.target.value)}
                            placeholder="e.g., Marked vests, plain clothes, tactical gear..."
                            className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-[#6b7280] mb-1">Source URL (optional)</label>
                        <input
                            type="url"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                            placeholder="https://twitter.com/... or Instagram/TikTok link"
                            className="w-full bg-[#242838] border border-[#3d4358] rounded-lg px-4 py-3 text-white"
                        />
                        <p className="text-xs text-[#6b7280] mt-1">Link to social media post, news article, or other source</p>
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
                    <div className="flex justify-between items-center text-xs">
                        <p className="text-[#6b7280]">
                            ⚠️ Do not include addresses, phone numbers, or license plates.
                        </p>
                        <span className={description.trim().length < 10 ? 'text-red-400' : 'text-[#5dd39e]'}>
                            {description.trim().length}/10 min
                        </span>
                    </div>
                </section>

                {/* Photo */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Photo</h2>

                    {incident.data.attachments && incident.data.attachments.length > 0 ? (
                        <div className="space-y-2">
                            {incident.data.attachments.map((att) => (
                                <div key={att.id} className="bg-[#242838] rounded-lg p-3 flex items-center gap-3">
                                    <span className="text-2xl">{att.type === 'image' ? '📷' : '🎥'}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-zinc-300 truncate">{att.original_name}</p>
                                        <p className="text-xs text-[#5dd39e]">Ready to upload when posted</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <label className="block cursor-pointer">
                            <div className="flex items-center justify-center gap-2 w-full bg-[#242838] border border-dashed border-zinc-600 rounded-lg px-4 py-8 text-[#9ca3af] hover:bg-zinc-800 hover:border-zinc-500 transition-colors">
                                <Camera className="w-6 h-6" />
                                <span className="text-lg">Add Photo</span>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                    )}
                </section>
            </div>

            {/* Fixed Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/5 px-4 py-4">
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
                        className={incident.posted_to_public ? 'bg-green-700' : 'bg-red-600 hover:bg-red-500'}
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

export default function ReportEditPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1a1d2e] flex items-center justify-center text-[#6b7280]">Loading...</div>}>
            <ReportEditContent />
        </Suspense>
    );
}

