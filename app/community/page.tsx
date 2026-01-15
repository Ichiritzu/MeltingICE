'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, CommunityEvent, CommunityDonation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Megaphone, Heart, MapPin, X, ExternalLink, Calendar, Scale, HandHeart, Shield, Loader2, Users } from 'lucide-react';

// Category config for donation display
const categoryConfig: Record<string, { label: string; color: string }> = {
    legal: { label: 'Legal Aid', color: 'bg-purple-500' },
    mutual_aid: { label: 'Mutual Aid', color: 'bg-green-500' },
    advocacy: { label: 'Advocacy', color: 'bg-blue-500' },
    bail: { label: 'Bail Fund', color: 'bg-orange-500' },
    general: { label: 'General', color: 'bg-zinc-500' },
};

export default function CommunityPage() {
    // Data from API
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [donations, setDonations] = useState<CommunityDonation[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitType, setSubmitType] = useState<'event' | 'donation'>('event');
    const [formData, setFormData] = useState({
        email: '',
        title: '',
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        organizer: '',
        link: '',
        category: 'general',
        isAllDay: false,
        isNationwide: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Fetch data on mount
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [eventsData, donationsData] = await Promise.all([
                api.getCommunityEvents(),
                api.getCommunityDonations(),
            ]);
            setEvents(eventsData);
            setDonations(donationsData);
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitStatus('idle');

        try {
            let result;
            if (submitType === 'event') {
                result = await api.submitCommunityEvent({
                    email: formData.email,
                    title: formData.title,
                    description: formData.description,
                    event_date: formData.date,
                    event_time: formData.time || undefined,
                    location: formData.location,
                    organizer: formData.organizer || undefined,
                    link: formData.link || undefined,
                });
            } else {
                result = await api.submitCommunityDonation({
                    email: formData.email,
                    name: formData.name,
                    description: formData.description,
                    link: formData.link,
                    category: formData.category,
                });
            }

            if (result.success) {
                setSubmitStatus('success');
                setFormData({ email: '', title: '', name: '', description: '', date: '', time: '', location: '', organizer: '', link: '', category: 'general', isAllDay: false, isNationwide: false });
                setTimeout(() => {
                    setShowSubmitModal(false);
                    setSubmitStatus('idle');
                }, 2000);
            } else {
                setSubmitStatus('error');
            }
        } catch {
            setSubmitStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'legal': return <Scale className="w-4 h-4" />;
            case 'mutual_aid': return <HandHeart className="w-4 h-4" />;
            case 'advocacy': return <Megaphone className="w-4 h-4" />;
            case 'bail': return <Shield className="w-4 h-4" />;
            default: return <Heart className="w-4 h-4" />;
        }
    };

    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-transparent">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Community</span> Action
                </h1>
                <p className="text-[#9ca3af] max-w-md mx-auto text-sm mb-4">
                    Find upcoming events and organizations supporting immigrant communities.
                </p>
                <Button
                    onClick={() => setShowSubmitModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                >
                    + Submit Event or Organization
                </Button>
            </section>

            {
                loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                    </div>
                ) : (
                    <>
                        {/* Events Section */}
                        <section className="max-w-6xl mx-auto px-4 py-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Megaphone className="w-6 h-6 text-orange-400" />
                                <h2 className="text-2xl font-bold">Upcoming Events</h2>
                            </div>

                            {events.length === 0 ? (
                                <div className="text-center py-12 text-[#9ca3af] bg-[#242838] rounded-2xl border border-white/5">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No upcoming events yet.</p>
                                    <button
                                        onClick={() => { setSubmitType('event'); setShowSubmitModal(true); }}
                                        className="text-purple-400 hover:underline mt-2"
                                    >
                                        Submit the first one!
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {events.map((event) => (
                                        <div key={event.id} className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-orange-400/30 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-lg text-xs font-bold">
                                                    {formatDate(event.event_date)}
                                                </div>
                                                {event.event_time && <span className="text-xs text-zinc-500">{event.event_time}</span>}
                                            </div>
                                            <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                                            <p className="text-sm text-[#9ca3af] mb-3 line-clamp-2">{event.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">{event.location}</span>
                                            </div>
                                            {event.organizer && (
                                                <p className="text-xs text-zinc-500 mb-3">By: {event.organizer}</p>
                                            )}
                                            {event.link && (
                                                <a href={event.link} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-orange-400 hover:underline">
                                                    Event Details <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Donations Section */}
                        <section className="max-w-6xl mx-auto px-4 py-10">
                            <div className="flex items-center gap-3 mb-6">
                                <Heart className="w-6 h-6 text-pink-400" />
                                <h2 className="text-2xl font-bold">Support Organizations</h2>
                            </div>

                            {donations.length === 0 ? (
                                <div className="text-center py-12 text-[#9ca3af] bg-[#242838] rounded-2xl border border-white/5">
                                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No organizations listed yet.</p>
                                    <button
                                        onClick={() => { setSubmitType('donation'); setShowSubmitModal(true); }}
                                        className="text-pink-400 hover:underline mt-2"
                                    >
                                        Submit an organization!
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {donations.map((org) => (
                                        <a
                                            key={org.id}
                                            href={org.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-pink-400/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`${categoryConfig[org.category]?.color || 'bg-zinc-500'} p-1.5 rounded-lg text-white`}>
                                                    {getCategoryIcon(org.category)}
                                                </span>
                                                <span className="text-xs text-zinc-400 uppercase tracking-wider">
                                                    {categoryConfig[org.category]?.label || 'General'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition-colors">{org.name}</h3>
                                            <p className="text-sm text-[#9ca3af] line-clamp-3">{org.description}</p>
                                            <div className="mt-4 flex items-center gap-1 text-sm text-pink-400">
                                                Donate <ExternalLink className="w-3 h-3" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )
            }

            {/* Submit Modal */}
            {
                showSubmitModal && (
                    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowSubmitModal(false)}>
                        <div className="bg-[#242838] border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="font-bold text-lg">Submit to Community</h3>
                                <button onClick={() => setShowSubmitModal(false)} className="text-zinc-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Type toggle */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSubmitType('event')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${submitType === 'event'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-zinc-700 text-zinc-400'
                                            }`}
                                    >
                                        <Megaphone className="w-4 h-4 inline mr-1" /> Event
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubmitType('donation')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${submitType === 'donation'
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-zinc-700 text-zinc-400'
                                            }`}
                                    >
                                        <Heart className="w-4 h-4 inline mr-1" /> Organization
                                    </button>
                                </div>

                                {/* Email field - shown for both types */}
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Your Email * <span className="text-zinc-500">(for approval notification)</span></label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@example.com"
                                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                {submitType === 'event' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Event Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Description *</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none"
                                            />
                                        </div>

                                        {/* Date and Time with All Day option */}
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Date *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={formData.date}
                                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-zinc-400 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        disabled={formData.isAllDay}
                                                        value={formData.time}
                                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                                        className={`w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none ${formData.isAllDay ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isAllDay}
                                                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked, time: e.target.checked ? '' : formData.time })}
                                                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-purple-500 focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-zinc-300">All Day Event</span>
                                            </label>
                                        </div>

                                        {/* Location with Nationwide option */}
                                        <div className="space-y-2">
                                            <label className="block text-sm text-zinc-400 mb-1">Location *</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    required
                                                    disabled={formData.isNationwide}
                                                    value={formData.isNationwide ? 'Nationwide' : formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    placeholder="City, State or venue"
                                                    className={`flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none ${formData.isNationwide ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, isNationwide: !formData.isNationwide, location: formData.isNationwide ? '' : 'Nationwide' })}
                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.isNationwide ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                                                >
                                                    🇺🇸 Nationwide
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Organizer</label>
                                            <input
                                                type="text"
                                                value={formData.organizer}
                                                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Event Link</label>
                                            <input
                                                type="url"
                                                value={formData.link}
                                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                placeholder="https://"
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Organization Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Description *</label>
                                            <textarea
                                                required
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Category</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            >
                                                <option value="legal">Legal Aid</option>
                                                <option value="mutual_aid">Mutual Aid</option>
                                                <option value="advocacy">Advocacy</option>
                                                <option value="bail">Bail Fund</option>
                                                <option value="general">General</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Donation Link *</label>
                                            <input
                                                type="url"
                                                required
                                                value={formData.link}
                                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                placeholder="https://"
                                                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {submitStatus === 'success' && (
                                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center text-green-300 text-sm">
                                        ✓ Submitted! It will appear after admin approval.
                                    </div>
                                )}

                                {submitStatus === 'error' && (
                                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center text-red-300 text-sm">
                                        Failed to submit. Please try again.
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Review'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
}
