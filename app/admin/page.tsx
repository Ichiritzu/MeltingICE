'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Button } from '@/components/ui/button';
import {
    Shield, Eye, EyeOff, Trash2, CheckCircle, Flag,
    LogOut, RefreshCw, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://meltingice.app/api';

interface AdminReport {
    id: string;
    event_time_bucket: string;
    city: string | null;
    state: string | null;
    tag: string;
    summary: string;
    confidence: number;
    upvotes: number;
    downvotes: number;
    flag_count: number;
    is_hidden: boolean;
    is_verified: boolean;
    image_url: string | null;
    pending_flags: number;
    flag_reasons: string | null;
    created_at: string;
}

// Community Types
interface CommunityItem {
    id: number;
    type: 'event' | 'donation';
    title: string; // or name for donation
    description: string;
    submitter_email: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    details: any; // Raw data
}

export default function AdminPage() {
    const toast = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Data States
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);

    // Filter State
    const [filter, setFilter] = useState<'all' | 'flagged' | 'hidden' | 'verified' | 'community'>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Check for existing token
    useEffect(() => {
        const savedToken = localStorage.getItem('admin_token');
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    // Load data when logged in or filter changes
    useEffect(() => {
        if (!token) return;

        if (filter === 'community') {
            loadCommunityItems();
        } else {
            loadReports();
        }
    }, [token, filter, page]);

    async function login() {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('admin_token', data.data.token);
                setToken(data.data.token);
                toast.success('Login successful');
            } else {
                toast.error(data.error || 'Login failed');
            }
        } catch (err) {
            toast.error('Connection error');
        }
        setLoading(false);
    }

    function logout() {
        localStorage.removeItem('admin_token');
        setToken(null);
        setReports([]);
        setCommunityItems([]);
        toast.info('Logged out');
    }

    async function loadReports() {
        try {
            const response = await fetch(`${API_BASE}/admin/reports.php?filter=${filter}&page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();

            if (data.success) {
                setReports(data.data.reports || []);
                setTotalPages(data.data.pagination?.pages || 1);
            } else if (response.status === 401) {
                logout();
            }
        } catch (err) {
            console.error('Failed to load reports:', err);
        }
    }

    async function loadCommunityItems() {
        try {
            const response = await fetch(`${API_BASE}/admin/community/list.php?status=pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) {
                console.warn('Community items not available:', response.status);
                setCommunityItems([]);
                return;
            }

            const data = await response.json();

            if (data.success) {
                // Combine events and donations into a single list
                const items = [
                    ...(data.events || []).map((e: any) => ({ ...e, type: 'event' })),
                    ...(data.donations || []).map((d: any) => ({ ...d, type: 'donation' })),
                ];
                setCommunityItems(items);
            }
        } catch (err) {
            console.error('Failed to load community items:', err);
            setCommunityItems([]);
        }
    }

    async function moderate(reportId: string, action: string) {
        try {
            const response = await fetch(`${API_BASE}/admin/moderate.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ report_id: reportId, action }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(`Report ${action} successful`);
                loadReports();
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (err) {
            toast.error('Connection error');
        }
    }

    async function moderateCommunity(id: number, type: 'event' | 'donation', action: 'approve' | 'reject' | 'delete') {
        const endpoint = action === 'delete' ? 'delete' : action;
        // Endpoint mapping: approve.php, reject.php, delete.php

        try {
            const response = await fetch(`${API_BASE}/admin/community/${endpoint}.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ id, type }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(`Item ${action}ed successfully`); // "approved" / "rejected" / "deleted"
                loadCommunityItems();
            } else {
                toast.error(data.error || 'Action failed');
            }
        } catch (err) {
            toast.error('Connection error');
        }
    }

    // Tag colors using Thaw palette
    const tagColors: Record<string, string> = {
        raid: 'bg-[#e85d75]',
        checkpoint: 'bg-[#ffb347]',
        detention: 'bg-[#6366f1]',
        vehicle: 'bg-[#ff7b5f]',
        unknown: 'bg-[#5ecfcf]',
    };

    // Login Screen
    if (!token) {
        return (
            <main className="min-h-screen bg-[#1a1d2e] flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-[#242838] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Shield className="w-8 h-8 text-[#ff7b5f]" />
                        <h1 className="text-2xl font-bold text-[#f5f0eb]">Admin Login</h1>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1a1d2e] border border-[#3d4358] rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#ff7b5f] focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && login()}
                            className="w-full bg-[#1a1d2e] border border-[#3d4358] rounded-xl px-4 py-3 text-[#f5f0eb] focus:border-[#ff7b5f] focus:outline-none"
                        />
                        <Button
                            onClick={login}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] hover:opacity-90 text-white shadow-lg"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    // Admin Dashboard
    return (
        <main className="min-h-screen bg-[#1a1d2e] text-[#f5f0eb]">
            {/* Header */}
            <header className="bg-[#242838] border-b border-white/5 px-4 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-[#ff7b5f]" />
                        <h1 className="font-bold text-lg">Admin Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => filter === 'community' ? loadCommunityItems() : loadReports()} className="text-[#9ca3af] hover:text-[#f5f0eb]">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={logout} className="text-[#9ca3af] hover:text-[#e85d75]">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {(['all', 'flagged', 'hidden', 'verified', 'community'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors capitalize ${filter === f
                                ? 'bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] text-white'
                                : 'bg-[#242838] text-[#9ca3af] hover:bg-[#2d3348]'
                                }`}
                        >
                            {f === 'flagged' && '🚩 '}
                            {f === 'hidden' && '👁️ '}
                            {f === 'verified' && '✓ '}
                            {f === 'community' && '👥 '}
                            {f}
                        </button>
                    ))}
                </div>

                {/* Community Table */}
                {filter === 'community' ? (
                    <div className="bg-[#242838] border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#2d3348] text-left text-xs uppercase text-[#9ca3af]">
                                <tr>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Details</th>
                                    <th className="px-4 py-3">Link/Location</th>
                                    <th className="px-4 py-3">Actions</th>

                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {communityItems.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-[#2d3348]/50">
                                        <td className="px-4 py-4 align-top">
                                            <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${item.type === 'event' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <div className="mt-2 text-xs text-[#6b7280]">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h3 className="font-bold text-[#f5f0eb]">{item.title}</h3>
                                            <p className="text-sm text-[#9ca3af] mt-1 whitespace-pre-wrap">{item.description}</p>
                                            {item.submitter_email && (
                                                <div className="mt-2 text-xs text-[#6b7280] flex items-center gap-1">
                                                    📧 {item.submitter_email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {item.details.link && (
                                                <a href={item.details.link} target="_blank" rel="noopener noreferrer" className="text-[#ff7b5f] hover:underline block mb-1">
                                                    View Link ↗
                                                </a>
                                            )}
                                            {item.details.location && (
                                                <span className="text-[#9ca3af]">
                                                    📍 {item.details.location}
                                                </span>
                                            )}
                                            {item.details.event_date && (
                                                <div className="text-[#9ca3af]">
                                                    📅 {new Date(item.details.event_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => moderateCommunity(item.id, item.type, 'approve')}
                                                    className="p-2 bg-[#5dd39e]/20 hover:bg-[#5dd39e]/40 rounded-lg text-[#5dd39e]"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => moderateCommunity(item.id, item.type, 'reject')}
                                                    className="p-2 bg-[#e85d75]/20 hover:bg-[#e85d75]/40 rounded-lg text-[#e85d75]"
                                                    title="Reject"
                                                >
                                                    <LogOut className="w-4 h-4 rotate-180" /> {/* Using LogOut as Reject icon */}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {communityItems.length === 0 && (
                            <div className="text-center py-12 text-[#6b7280]">
                                No pending community items
                            </div>
                        )}
                    </div>
                ) : (
                    /* Reports Table (Existing) */
                    <div className="bg-[#242838] border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-[#2d3348] text-left text-xs uppercase text-[#9ca3af]">
                                <tr>
                                    <th className="px-4 py-3">Report</th>
                                    <th className="px-4 py-3">Stats</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-[#2d3348]/50">
                                        <td className="px-4 py-4">
                                            <div className="flex gap-3">
                                                {report.image_url && (
                                                    <img
                                                        src={report.image_url}
                                                        alt=""
                                                        className="w-16 h-16 object-cover rounded-xl"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase ${tagColors[report.tag] || tagColors.unknown}`}>
                                                            {report.tag}
                                                        </span>
                                                        {report.city && (
                                                            <span className="text-xs text-[#6b7280]">
                                                                {report.city}, {report.state}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] bg-[#3d4358] px-1.5 py-0.5 rounded text-[#9ca3af] font-mono" title={report.id}>
                                                            #{report.id.substring(0, 6)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[#f5f0eb] line-clamp-2">{report.summary}</p>
                                                    {report.flag_reasons && (
                                                        <p className="text-xs text-[#e85d75] mt-1 font-medium bg-[#e85d75]/10 p-1 rounded">
                                                            🚩 Flags: {report.flag_reasons}
                                                        </p>
                                                    )}
                                                    <div className="text-[10px] text-[#6b7280] mt-1 font-mono select-all">
                                                        ID: {report.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm space-y-1">
                                                <div className="text-[#5dd39e]">↑ {report.upvotes}</div>
                                                <div className="text-[#e85d75]">↓ {report.downvotes}</div>
                                                <div className="text-[#9ca3af]">Score: {report.confidence}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {!!report.is_verified && (
                                                    <span className="px-2 py-1 bg-[#5dd39e]/20 text-[#5dd39e] rounded-lg text-xs">Verified</span>
                                                )}
                                                {!!report.is_hidden && (
                                                    <span className="px-2 py-1 bg-[#6b7280]/20 text-[#9ca3af] rounded-lg text-xs">Hidden</span>
                                                )}
                                                {report.flag_count > 0 && (
                                                    <span className="px-2 py-1 bg-[#e85d75]/20 text-[#e85d75] rounded-lg text-xs">
                                                        {report.flag_count} flags
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {!report.is_verified && (
                                                    <button
                                                        onClick={() => moderate(report.id, 'verify')}
                                                        className="p-2 bg-[#5dd39e]/20 hover:bg-[#5dd39e]/40 rounded-lg text-[#5dd39e]"
                                                        title="Verify"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {!!report.is_verified && (
                                                    <button
                                                        onClick={() => moderate(report.id, 'unverify')}
                                                        className="p-2 bg-[#6b7280]/20 hover:bg-[#6b7280]/40 rounded-lg text-[#9ca3af]"
                                                        title="Unverify"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {!report.is_hidden ? (
                                                    <button
                                                        onClick={() => moderate(report.id, 'hide')}
                                                        className="p-2 bg-[#6b7280]/20 hover:bg-[#6b7280]/40 rounded-lg text-[#9ca3af]"
                                                        title="Hide"
                                                    >
                                                        <EyeOff className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => moderate(report.id, 'unhide')}
                                                        className="p-2 bg-[#5ecfcf]/20 hover:bg-[#5ecfcf]/40 rounded-lg text-[#5ecfcf]"
                                                        title="Unhide"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {report.flag_count > 0 && (
                                                    <button
                                                        onClick={() => moderate(report.id, 'resolve_flags')}
                                                        className="p-2 bg-[#ffb347]/20 hover:bg-[#ffb347]/40 rounded-lg text-[#ffb347]"
                                                        title="Resolve Flags"
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this report? This cannot be undone.')) {
                                                            moderate(report.id, 'delete');
                                                        }
                                                    }}
                                                    className="p-2 bg-[#e85d75]/20 hover:bg-[#e85d75]/40 rounded-lg text-[#e85d75]"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {reports.length === 0 && (
                            <div className="text-center py-12 text-[#6b7280]">
                                No reports found
                            </div>
                        )}
                    </div>
                )}


                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="ghost"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="text-[#9ca3af]"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="px-4 py-2 text-[#9ca3af]">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="text-[#9ca3af]"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}
