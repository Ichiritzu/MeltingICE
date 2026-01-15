'use client';

import type { PublicReport } from '@/lib/api';
import api from '@/lib/api';
import { MapPin, Clock, Camera, ThumbsUp, ThumbsDown, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

const tagLabels: Record<string, string> = {
    vehicle: 'Vehicle',
    checkpoint: 'Checkpoint',
    detention: 'Detention',
    raid: 'Raid',
    unknown: 'Activity',
};

// Updated with Thaw palette
const tagColors: Record<string, string> = {
    vehicle: 'bg-[#ff7b5f]',      // Sunset coral
    checkpoint: 'bg-[#ffb347]',   // Golden dawn
    detention: 'bg-[#6366f1]',    // Indigo
    raid: 'bg-[#e85d75]',         // Soft red
    unknown: 'bg-[#5ecfcf]',      // Aqua flow
};

interface ReportCardProps {
    report: PublicReport;
    onClick?: () => void;
    onVote?: () => void;
}

export function ReportCard({ report, onClick, onVote }: ReportCardProps) {
    const toast = useToast();
    const timeAgo = getTimeAgo(report.event_time_bucket);
    const [showFullImage, setShowFullImage] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [localUpvotes, setLocalUpvotes] = useState(Number(report.upvotes) || 0);
    const [localDownvotes, setLocalDownvotes] = useState(Number(report.downvotes) || 0);
    const [userVote, setUserVote] = useState<'up' | 'down' | null>(report.user_vote || null);
    const [voting, setVoting] = useState(false);

    // Convert is_verified to boolean (handles 0, 1, true, false from API)
    const isVerified = !!report.is_verified;

    async function handleVote(voteType: 'up' | 'down', e: React.MouseEvent) {
        e.stopPropagation();
        if (voting) return;

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
            onVote?.();
        } else {
            toast.error('Failed to record vote. Please try again.');
        }
    }

    async function handleFlag(reason: string) {
        const success = await api.flag(report.id, reason);
        setShowFlagModal(false);
        if (success) {
            toast.success('Report flagged. Thank you for helping keep the community safe.');
        } else {
            toast.error('Could not flag report. You may have already flagged it.');
        }
    }

    // Thaw palette confidence colors
    const confidenceScore = Number(report.confidence) || 0;
    const confidenceColor = confidenceScore >= 70 ? 'text-[#5dd39e]' :
        confidenceScore >= 40 ? 'text-[#ffb347]' : 'text-[#e85d75]';

    return (
        <>
            <div
                onClick={onClick}
                className="bg-[#242838] border border-white/5 rounded-2xl overflow-hidden hover:border-[#ff7b5f]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[#ff7b5f]/5 h-full flex flex-col"
            >
                {/* Image Thumbnail */}
                {report.image_url && (
                    <div
                        className="relative w-full h-32 bg-[#1a1d2e] cursor-zoom-in"
                        onClick={(e) => { e.stopPropagation(); setShowFullImage(true); }}
                    >
                        <img
                            src={report.image_url}
                            alt="Report evidence"
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />

                        {isVerified && (
                            <div className="absolute top-2 left-2 bg-[#5dd39e]/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${tagColors[report.tag] || tagColors.unknown} text-white`}>
                                {tagLabels[report.tag] || tagLabels.unknown}
                            </span>
                            {!report.image_url && isVerified && (
                                <span className="flex items-center gap-1 text-[#5dd39e] text-xs">
                                    <CheckCircle className="w-3 h-3" />
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                            <span className={`font-semibold ${confidenceColor}`}>
                                {confidenceScore}%
                            </span>
                            <span className="opacity-50">•</span>
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo}</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-[#f5f0eb] mb-3 line-clamp-3 leading-relaxed">
                        {report.summary}
                    </p>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-[#9ca3af] mb-3">
                        <MapPin className="w-3 h-3 text-[#5ecfcf]" />
                        <span>{report.city && report.state ? `${report.city}, ${report.state}` : 'Location reported'}</span>
                        {!!report.evidence_present && !report.image_url && (
                            <span className="ml-2 flex items-center gap-1 text-[#5dd39e]">
                                <Camera className="w-3 h-3" />
                                Evidence
                            </span>
                        )}
                    </div>

                    {/* Vote Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => handleVote('up', e)}
                                disabled={voting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${userVote === 'up'
                                    ? 'bg-[#5dd39e]/20 text-[#5dd39e] border border-[#5dd39e]/30'
                                    : 'bg-[#2d3348] text-[#9ca3af] hover:bg-[#3d4358] hover:text-[#5dd39e]'
                                    }`}
                            >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{localUpvotes}</span>
                            </button>
                            <button
                                onClick={(e) => handleVote('down', e)}
                                disabled={voting}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${userVote === 'down'
                                    ? 'bg-[#e85d75]/20 text-[#e85d75] border border-[#e85d75]/30'
                                    : 'bg-[#2d3348] text-[#9ca3af] hover:bg-[#3d4358] hover:text-[#e85d75]'
                                    }`}
                            >
                                <ThumbsDown className="w-4 h-4" />
                                <span>{localDownvotes}</span>
                            </button>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowFlagModal(true); }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[#9ca3af] hover:text-[#e85d75] hover:bg-[#e85d75]/10 transition-colors"
                        >
                            <Flag className="w-3 h-3" />
                            Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Image Modal */}
            {showFullImage && report.image_url && (
                <div
                    className="fixed inset-0 z-[9999] bg-[#1a1d2e]/98 flex items-center justify-center p-4"
                    onClick={() => setShowFullImage(false)}
                >
                    <img
                        src={report.image_url}
                        alt="Report evidence full view"
                        className="max-w-full max-h-full object-contain rounded-2xl"
                    />
                    <button
                        className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-[#ff7b5f] transition-colors"
                        onClick={() => setShowFullImage(false)}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Flag Modal */}
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

function getTimeAgo(dateString: string): string {
    const isoString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (isNaN(date.getTime())) return 'Recently';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) return 'Just now';
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

export default ReportCard;
