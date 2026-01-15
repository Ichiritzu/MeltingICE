'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, PublicReport, CommunityEvent, CommunityDonation } from '@/lib/api';
import { ReportCard } from '@/components/ui/ReportCard';
import { Button } from '@/components/ui/button';
import { Plus, ShieldAlert, FileText, Send, BookOpen, Search, SlidersHorizontal, Calendar, Users, Heart, Megaphone, MapPin } from 'lucide-react';

// Dynamic import for Map (SSR disabled) - using vanilla Leaflet
const LeafletMap = dynamic(() => import('@/components/ui/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#1a1d2e] animate-pulse flex items-center justify-center text-[#9ca3af]">
      Loading map...
    </div>
  ),
});

export default function HomePage() {
  const router = useRouter();
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence'>('newest');
  const [mapDateFilter, setMapDateFilter] = useState<'all' | '24h' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Community data from API
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [communityDonations, setCommunityDonations] = useState<CommunityDonation[]>([]);

  // Tag colors matching the map legend
  const tagColors: Record<string, string> = {
    vehicle: '#f97316',
    checkpoint: '#eab308',
    detention: '#8b5cf6',
    raid: '#ef4444',
    unknown: '#06b6d4',
  };

  const tagLabels: Record<string, string> = {
    vehicle: 'Vehicle',
    checkpoint: 'Checkpoint',
    detention: 'Detention',
    raid: 'Raid',
    unknown: 'Activity',
  };

  useEffect(() => {
    loadReports();
    loadCommunityData();
  }, []);

  async function loadReports() {
    setLoading(true);
    const data = await api.getReports({ limit: 20 });
    setReports(data.reports);
    setLoading(false);
  }

  async function loadCommunityData() {
    const [events, donations] = await Promise.all([
      api.getCommunityEvents(),
      api.getCommunityDonations(),
    ]);
    setCommunityEvents(events);
    setCommunityDonations(donations);
  }

  async function handleSearch() {
    if (!searchCity.trim()) {
      loadReports();
      return;
    }
    setLoading(true);
    const data = await api.getReports({ city: searchCity, limit: 20 });
    setReports(data.reports);
    setLoading(false);
  }

  // Filter reports for the map by date range
  const mapFilteredReports = reports.filter(report => {
    if (mapDateFilter === 'all') return true;
    const eventDate = new Date(report.event_time_bucket.replace(' ', 'T') + 'Z');
    const now = new Date();

    if (mapDateFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(0);
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : now;
      return eventDate >= start && eventDate <= end;
    }

    const diffMs = now.getTime() - eventDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (mapDateFilter === '24h') return diffHours <= 24;
    if (mapDateFilter === '7d') return diffHours <= 24 * 7;
    if (mapDateFilter === '30d') return diffHours <= 24 * 30;
    return true;
  });

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => activeFilter === 'all' || report.tag === activeFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.event_time_bucket).getTime() - new Date(a.event_time_bucket).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.event_time_bucket).getTime() - new Date(b.event_time_bucket).getTime();
      } else {
        return (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
      }
    });

  return (
    <>
      {/* Hero Section */}
      <section className="py-10 px-4 text-center bg-gradient-to-b from-[#ff7b5f]/10 via-[#ffb347]/5 to-transparent">
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Community <span className="bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] bg-clip-text text-transparent">Safety</span> Hub
        </h1>
        <p className="text-[#9ca3af] max-w-xl mx-auto">
          Know your rights. Report safely. Take action together.
        </p>
      </section>

      {/* Action Cards */}
      <section className="max-w-6xl mx-auto px-4 py-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Report Activity */}
        <Link href="/report" className="group">
          <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-orange-400/40 transition-all hover:shadow-lg hover:shadow-orange-400/5 h-full flex flex-col">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#f5f0eb] group-hover:text-orange-400 transition-colors">
              Report Activity
            </h3>
            <p className="text-sm text-[#9ca3af] flex-1">
              Submit anonymous reports and document incidents privately.
            </p>
            <span className="text-orange-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Get started →
            </span>
          </div>
        </Link>

        {/* Emergency Mode */}
        <Link href="/emergency" className="group">
          <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-red-400/40 transition-all hover:shadow-lg hover:shadow-red-400/5 h-full flex flex-col">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#f5f0eb] group-hover:text-red-400 transition-colors">
              Emergency Mode
            </h3>
            <p className="text-sm text-[#9ca3af] flex-1">
              Know your rights and quick scripts for encounters.
            </p>
            <span className="text-red-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Stay prepared →
            </span>
          </div>
        </Link>

        {/* File Complaints */}
        <Link href="/submit" className="group">
          <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-green-400/40 transition-all hover:shadow-lg hover:shadow-green-400/5 h-full flex flex-col">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Send className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#f5f0eb] group-hover:text-green-400 transition-colors">
              File Complaints
            </h3>
            <p className="text-sm text-[#9ca3af] flex-1">
              Official DHS channels and complaint templates.
            </p>
            <span className="text-green-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Take action →
            </span>
          </div>
        </Link>

        {/* Resources */}
        <Link href="/resources" className="group">
          <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-teal-400/40 transition-all hover:shadow-lg hover:shadow-teal-400/5 h-full flex flex-col">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#f5f0eb] group-hover:text-teal-400 transition-colors">
              Resources
            </h3>
            <p className="text-sm text-[#9ca3af] flex-1">
              Hotlines, legal aid, and civic engagement links.
            </p>
            <span className="text-teal-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Find help →
            </span>
          </div>
        </Link>
      </section>

      {/* Community Highlights */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-[#f5f0eb]">Community Action</h2>
          </div>
          <Link href="/community" className="text-sm text-purple-400 hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Featured Event */}
          {communityEvents[0] && (
            <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-orange-400/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-orange-400" />
                <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded text-xs font-bold">
                  Upcoming Event
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 line-clamp-2">{communityEvents[0].title}</h3>
              <p className="text-sm text-[#9ca3af] mb-2 line-clamp-2">{communityEvents[0].description}</p>
              <p className="text-xs text-zinc-500">{communityEvents[0].location}</p>
            </div>
          )}

          {/* Featured Donations */}
          {communityDonations.slice(0, communityEvents[0] ? 2 : 3).map((org) => (
            <div key={org.id} className="bg-[#242838] border border-white/5 rounded-2xl p-5 hover:border-pink-400/30 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded text-xs font-bold">
                  Support
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{org.name}</h3>
              <p className="text-sm text-[#9ca3af] line-clamp-2">{org.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#f5f0eb] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Activity Map
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <div className="flex bg-zinc-800 rounded-lg p-0.5 flex-wrap">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: '24h', label: '24h' },
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: 'custom', label: 'Custom' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMapDateFilter(option.value as typeof mapDateFilter)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapDateFilter === option.value
                      ? 'bg-cyan-500 text-white'
                      : 'text-zinc-400 hover:text-white'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom date inputs */}
          {mapDateFilter === 'custom' && (
            <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-400">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-600 rounded-lg px-2 py-1 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        <div className="h-[500px] rounded-2xl overflow-hidden border border-white/5 shadow-xl" style={{ touchAction: 'pan-y' }}>
          <LeafletMap reports={mapFilteredReports} height="500px" />
        </div>
      </section>

      {/* Reports Feed */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with title */}
        <h2 className="text-xl font-bold text-[#f5f0eb] mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-400" />
          Reports
        </h2>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilter === 'all'
              ? 'bg-white text-zinc-900'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
          >
            All
          </button>
          {Object.entries(tagLabels).map(([tag, label]) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${activeFilter === tag
                ? 'text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              style={activeFilter === tag ? { background: tagColors[tag] } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: tagColors[tag] }}
              />
              {label}
            </button>
          ))}
        </div>

        {/* Sort and Search row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'confidence')}
              className="bg-[#242838] border border-[#3d4358] rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 sm:w-48 bg-[#242838] border border-[#3d4358] rounded-xl px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
            />
            <Button size="sm" variant="secondary" onClick={handleSearch} className="bg-[#2d3348] hover:bg-[#3d4358]">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results count */}
        {!loading && filteredReports.length > 0 && filteredReports.length !== reports.length && (
          <p className="text-xs text-zinc-500 mb-4">
            Showing {filteredReports.length} of {reports.length} reports
          </p>
        )}

        {loading ? (
          <div className="text-center py-12 text-[#9ca3af]">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-[#9ca3af]">
            {reports.length === 0 ? (
              <>
                <p>No reports yet.</p>
                <Link href="/report" className="text-[#ff7b5f] hover:underline">Be the first to report.</Link>
              </>
            ) : (
              <>
                <p>No reports matching "{tagLabels[activeFilter] || activeFilter}" filter.</p>
                <button onClick={() => setActiveFilter('all')} className="text-cyan-400 hover:underline mt-2">
                  Clear filter
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => router.push(`/reports?id=${report.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
