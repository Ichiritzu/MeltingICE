'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api, PublicReport } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/ui/MobileNav';
import { useToast } from '@/components/ui/ToastProvider';
import {
    ArrowLeft, Clock, Users, Car, Shirt, Link as LinkIcon,
    ThumbsUp, ThumbsDown, Flag, Share2, CheckCircle, ExternalLink, AlertTriangle
} from 'lucide-react';

// Dynamically import map to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap'), { ssr: false });

interface ReportDetailClientProps {
    id: string;
}

export default function ReportDetailClient({ id }: ReportDetailClientProps) {
    const router = useRouter();
    const toast = useToast();

    const [report, setReport] = useState<PublicReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Voting state (like ReportCard)
    const [localUpvotes, setLocalUpvotes] = useState(0);
    const [localDownvotes, setLocalDownvotes] = useState(0);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
    const [voting, setVoting] = useState(false);

    // Flag modal state
    const [showFlagModal, setShowFlagModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadReport();
        }
    }, [id]);

    async function loadReport() {
        setLoading(true);
        setError(null);
        const data = await api.getReport(id);
        if (data) {
            setReport(data);
            setLocalUpvotes(Number(data.upvotes) || 0);
            setLocalDownvotes(Number(data.downvotes) || 0);
            setUserVote(data.user_vote || null);
        } else {
            setError('Report not found');
        }
        setLoading(false);
    }

    // Same voting logic as ReportCard
    async function handleVote(voteType: 'up' | 'down') {
        if (!report || voting) return;

        setVoting(true);
        const result = await api.vote(report.id, voteType);
        setVoting(false);

        if (result) {
            if (result.action === 'added') {
                if (voteType === 'up') setLocalUpvotes(v => v + 1);
                else setLocalDownvotes(v => v + 1);
                setUserVote(voteType);
            } else if (result.action === 'removed') {
                if (voteType === 'up') setLocalUpvotes(v => Math.max(0, v - 1));
                else setLocalDownvotes(v => Math.max(0, v - 1));
                setUserVote(null);
            } else if (result.action === 'changed') {
                if (voteType === 'up') {
                    setLocalUpvotes(v => v + 1);
                    setLocalDownvotes(v => Math.max(0, v - 1));
                } else {
                    setLocalDownvotes(v => v + 1);
                    setLocalUpvotes(v => Math.max(0, v - 1));
                }
                setUserVote(voteType);
            }
        } else {
            toast.error('Failed to record vote. Please try again.');
        }
    }

    // Same flag logic as ReportCard
    async function handleFlag(reason: string) {
        if (!report) return;
        const success = await api.flag(report.id, reason);
        setShowFlagModal(false);
        if (success) {
            toast.success('Report flagged. Thank you for helping keep the community safe.');
        } else {
            toast.error('Could not flag report. You may have already flagged it.');
        }
    }

    function handleShare() {
        if (!report) return;
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `ICE Activity Report - ${report.city || 'Unknown'}, ${report.state || ''}`,
                text: report.summary,
                url,
            });
        } else {
            navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        }
    }

    // Tag colors
    const tagColors: Record<string, string> = {
        raid: 'bg-[#e85d75]',
        checkpoint: 'bg-[#ffb347]',
        detention: 'bg-[#ff7b5f]',
        vehicle: 'bg-[#5ecfcf]',
        warning: 'bg-[#a78bfa]',
        activity: 'bg-[#5ecfcf]',
        unknown: 'bg-[#6b7280]',
    };

    const tagLabels: Record<string, string> = {
        raid: 'Raid',
        checkpoint: 'Checkpoint',
        detention: 'Detention',
        vehicle: 'Vehicle',
        warning: 'Warning',
        activity: 'Activity',
        unknown: 'Activity',
    };

    // Memoize map data to prevent re-renders when voting
    const mapData = useMemo(() => {
        if (!report) return null;
        return {
            reports: [{
                id: report.id,
                lat_approx: report.lat_approx,
                lng_approx: report.lng_approx,
                tag: report.tag,
                summary: report.summary,
                city: report.city,
                state: report.state,
                event_time_bucket: report.event_time_bucket,
                upvotes: report.upvotes,
                downvotes: report.downvotes,
                confidence: report.confidence,
            }],
            center: [report.lat_approx, report.lng_approx] as [number, number],
        };
    }, [report?.id, report?.lat_approx, report?.lng_approx]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#1a1d2e] flex items-center justify-center">
                <div className="animate-pulse text-[#9ca3af]">Loading report...</div>
            </main>
        );
    }

    if (error || !report) {
        return (
            <main className="min-h-screen bg-[#1a1d2e] flex flex-col items-center justify-center gap-4 px-4">
                <div className="text-[#e85d75] text-lg">{error || 'Report not found'}</div>
                <Link href="/">
                    <Button variant="secondary">← Back to Map</Button>
                </Link>
            </main>
        );
    }

    const eventDate = new Date(report.event_time_bucket);

    return (
        <>
            <main className="min-h-screen bg-[#1a1d2e] text-[#f5f0eb] pb-24">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-[#1a1d2e]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-[#9ca3af]">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        </Link>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tagColors[report.tag] || tagColors.unknown}`}>
                            {tagLabels[report.tag] || report.tag}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleShare} className="text-[#9ca3af]">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {/* Location & Time */}
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold">
                            {report.city || 'Unknown Location'}{report.state ? `, ${report.state}` : ''}
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-sm text-[#9ca3af]">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!!report.is_verified && (
                                <span className="flex items-center gap-1 text-[#5dd39e]">
                                    <CheckCircle className="w-4 h-4" />
                                    Verified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Map - memoized to prevent re-renders on vote */}
                    {mapData && (
                        <div className="h-64 md:h-48 rounded-2xl overflow-hidden border border-white/5">
                            <LeafletMap
                                reports={mapData.reports as any}
                                center={mapData.center}
                                zoom={13}
                            />
                        </div>
                    )}

                    {/* Photo */}
                    {report.image_url && (
                        <div className="rounded-2xl overflow-hidden border border-white/5">
                            <img
                                src={report.image_url}
                                alt="Report evidence"
                                className="w-full h-auto max-h-80 object-cover"
                            />
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-[#242838] rounded-2xl p-5 border border-white/5">
                        <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-3">Activity Description</h2>
                        <p className="text-[#f5f0eb] leading-relaxed">{report.summary}</p>
                    </div>

                    {/* Documentation Details */}
                    {(report.activity_type || report.num_officials || report.num_vehicles || report.uniform_description) && (
                        <div className="bg-[#242838] rounded-2xl p-5 border border-white/5 space-y-4">
                            <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">Details</h2>

                            <div className="grid grid-cols-2 gap-4">
                                {report.activity_type && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#6b7280]">Type:</span>
                                        <span className="font-medium capitalize">{report.activity_type}</span>
                                    </div>
                                )}
                                {report.num_officials && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-[#5ecfcf]" />
                                        <span>{report.num_officials === 'unknown' ? 'Unknown' : report.num_officials} officials</span>
                                    </div>
                                )}
                                {report.num_vehicles && (
                                    <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-[#ffb347]" />
                                        <span>{report.num_vehicles === 'unknown' ? 'Unknown' : report.num_vehicles} vehicles</span>
                                    </div>
                                )}
                                {report.uniform_description && (
                                    <div className="flex items-center gap-2 col-span-2">
                                        <Shirt className="w-4 h-4 text-[#a78bfa]" />
                                        <span>{report.uniform_description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Source URL */}
                    {report.source_url && (
                        <a
                            href={report.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-[#242838] rounded-2xl p-4 border border-white/5 hover:border-[#5ecfcf]/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-5 h-5 text-[#5ecfcf]" />
                                <div>
                                    <p className="text-sm font-medium">View Source</p>
                                    <p className="text-xs text-[#6b7280] truncate max-w-[250px]">{report.source_url}</p>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-[#9ca3af]" />
                        </a>
                    )}

                    {/* Voting Bar - Same style as ReportCard */}
                    <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/5">
                        <button
                            onClick={() => handleVote('up')}
                            disabled={voting}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${userVote === 'up'
                                ? 'bg-[#5dd39e]/20 text-[#5dd39e] border border-[#5dd39e]/30'
                                : 'bg-[#2d3348] text-[#9ca3af] hover:bg-[#3d4358] hover:text-[#5dd39e]'
                                }`}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            <span>{localUpvotes}</span>
                        </button>
                        <button
                            onClick={() => handleVote('down')}
                            disabled={voting}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${userVote === 'down'
                                ? 'bg-[#e85d75]/20 text-[#e85d75] border border-[#e85d75]/30'
                                : 'bg-[#2d3348] text-[#9ca3af] hover:bg-[#3d4358] hover:text-[#e85d75]'
                                }`}
                        >
                            <ThumbsDown className="w-4 h-4" />
                            <span>{localDownvotes}</span>
                        </button>
                        <button
                            onClick={() => setShowFlagModal(true)}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-[#e85d75] hover:bg-[#e85d75]/10 transition-colors"
                        >
                            <Flag className="w-4 h-4" />
                            <span>Report</span>
                        </button>
                    </div>

                    {/* Confidence */}
                    <div className="text-center text-sm text-[#6b7280]">
                        Confidence Score: <span className="font-bold text-[#f5f0eb]">{report.confidence || 0}</span>
                    </div>
                </div>

                {/* Mobile Nav */}
                <MobileNav activePage="home" />
            </main>

            {/* Flag Modal - Same as ReportCard */}
            {showFlagModal && (
                <div
                    className="fixed inset-0 z-[9999] bg-[#1a1d2e]/90 flex items-center justify-center p-4"
                    onClick={() => setShowFlagModal(false)}
                >
                    <div
                        className="bg-[#242838] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-[#ffb347]" />
                            <h3 className="font-bold text-lg text-[#f5f0eb]">Report this content</h3>
                        </div>
                        <p className="text-sm text-[#9ca3af] mb-4">
                            Why are you reporting this?
                        </p>
                        <div className="space-y-2">
                            {[
                                { key: 'false_info', label: 'False or misleading information' },
                                { key: 'spam', label: 'Spam or irrelevant content' },
                                { key: 'harassment', label: 'Harassment or abuse' },
                                { key: 'personal_info', label: 'Contains personal information' },
                                { key: 'other', label: 'Other issue' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => handleFlag(key)}
                                    className="w-full text-left px-4 py-3 bg-[#2d3348] hover:bg-[#3d4358] rounded-xl text-sm text-[#f5f0eb] transition-colors"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowFlagModal(false)}
                            className="w-full mt-4 px-4 py-2 text-[#9ca3af] hover:text-[#f5f0eb] transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
