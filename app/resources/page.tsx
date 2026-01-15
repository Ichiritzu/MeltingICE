'use client';

import { useEffect, useState } from 'react';
import { api, Resource } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BookOpen, Phone, Globe, ExternalLink } from 'lucide-react';

// Fallback data in case API fails
const fallbackHotlines = [
    { id: 1, title: 'United We Dream - MigraWatch', content: 'Report ICE activity, get rapid response.', metadata: { phone: '844-363-1423', url: 'https://unitedwedream.org' } },
    { id: 2, title: 'RAICES Texas', content: 'Legal services in Texas.', metadata: { phone: '210-787-3180', url: 'https://www.raicestexas.org' } },
    { id: 3, title: 'National Immigrant Justice Center', content: 'Legal assistance for immigrants.', metadata: { phone: '312-660-1370', url: 'https://immigrantjustice.org' } },
];

const fallbackLegal = [
    { id: 1, title: 'ACLU Immigrants Rights', content: 'Legal resources and advocacy.', metadata: { url: 'https://www.aclu.org/issues/immigrants-rights' } },
    { id: 2, title: 'National Immigration Law Center', content: 'Policy advocacy and legal support.', metadata: { url: 'https://www.nilc.org' } },
];

export default function ResourcesPage() {
    const [hotlines, setHotlines] = useState<any[]>(fallbackHotlines);
    const [legalAid, setLegalAid] = useState<any[]>(fallbackLegal);
    const [tab, setTab] = useState<'hotlines' | 'legal' | 'civic'>('hotlines');

    useEffect(() => {
        loadResources();
    }, []);

    async function loadResources() {
        try {
            const all = await api.getResources() as Record<string, Resource[]>;
            if (all.hotline) setHotlines(all.hotline);
            if (all.legal_aid) setLegalAid(all.legal_aid);
        } catch (e) {
            // Using fallback resources
        }
    }

    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-teal-500/10 via-green-500/5 to-transparent">
                <BookOpen className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">Help</span> & Resources
                </h1>
                <p className="text-[#9ca3af] max-w-md mx-auto text-sm">
                    Hotlines, legal aid, and civic engagement resources.
                </p>
            </section>

            {/* Tab Navigation */}
            <div className="max-w-lg mx-auto px-4 py-4">
                <div className="flex gap-1 bg-[#242838] rounded-xl p-1 overflow-x-auto">
                    {['hotlines', 'legal', 'civic'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t as any)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? 'bg-[#3d4358] text-[#f5f0eb]' : 'text-[#9ca3af] hover:text-[#f5f0eb]'
                                }`}
                        >
                            {t === 'hotlines' && '📞 Hotlines'}
                            {t === 'legal' && '⚖️ Legal Aid'}
                            {t === 'civic' && '🏛️ Civic'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-2 space-y-4">
                {tab === 'hotlines' && (
                    <>
                        <p className="text-xs text-[#9ca3af]">Emergency and support hotlines</p>
                        {hotlines.map((h) => (
                            <div key={h.id} className="bg-[#242838] border border-white/5 rounded-2xl p-4 hover:border-[#5ecfcf]/30 transition-colors">
                                <h3 className="font-bold text-[#f5f0eb] mb-1">{h.title}</h3>
                                <p className="text-sm text-[#9ca3af] mb-3">{h.content}</p>
                                <div className="flex gap-2">
                                    {h.metadata?.phone && (
                                        <a href={`tel:${h.metadata.phone}`}>
                                            <Button size="sm" className="bg-[#5dd39e] hover:bg-[#5dd39e]/90 text-white">
                                                <Phone className="w-4 h-4 mr-1" /> Call
                                            </Button>
                                        </a>
                                    )}
                                    {h.metadata?.url && (
                                        <a href={h.metadata.url} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline" className="border-[#5ecfcf] text-[#5ecfcf] hover:bg-[#5ecfcf]/10">
                                                <Globe className="w-4 h-4 mr-1" /> Website
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {tab === 'legal' && (
                    <>
                        <p className="text-xs text-[#9ca3af]">Legal aid organizations</p>
                        {legalAid.map((l) => (
                            <div key={l.id} className="bg-[#242838] border border-white/5 rounded-2xl p-4 hover:border-[#6366f1]/30 transition-colors">
                                <h3 className="font-bold text-[#f5f0eb] mb-1">{l.title}</h3>
                                <p className="text-sm text-[#9ca3af] mb-3">{l.content}</p>
                                {l.metadata?.url && (
                                    <a href={l.metadata.url} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="outline" className="border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1]/10">
                                            <ExternalLink className="w-4 h-4 mr-1" /> Visit
                                        </Button>
                                    </a>
                                )}
                            </div>
                        ))}
                    </>
                )}

                {tab === 'civic' && (
                    <>
                        <p className="text-xs text-[#9ca3af]">Find your elected representatives</p>

                        <div className="bg-[#242838] border border-white/5 rounded-2xl p-4">
                            <h3 className="font-bold text-[#f5f0eb] mb-2">Find Your Representative</h3>
                            <p className="text-sm text-[#9ca3af] mb-4">
                                Enter your address on the official government site to find your congressional representatives.
                            </p>
                            <div className="space-y-2">
                                <a
                                    href="https://www.house.gov/representatives/find-your-representative"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between bg-[#2d3348] hover:bg-[#3d4358] rounded-xl p-3 transition-colors"
                                >
                                    <span className="text-sm">House of Representatives</span>
                                    <ExternalLink className="w-4 h-4 text-[#5ecfcf]" />
                                </a>
                                <a
                                    href="https://www.senate.gov/senators/senators-contact.htm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between bg-[#2d3348] hover:bg-[#3d4358] rounded-xl p-3 transition-colors"
                                >
                                    <span className="text-sm">U.S. Senate</span>
                                    <ExternalLink className="w-4 h-4 text-[#5ecfcf]" />
                                </a>
                            </div>
                        </div>

                        <div className="bg-[#5ecfcf]/10 border border-[#5ecfcf]/20 rounded-2xl p-4">
                            <h4 className="font-bold text-[#5ecfcf] mb-2">💡 Tip</h4>
                            <p className="text-sm text-[#9ca3af]">
                                When contacting representatives, be specific about date, location (city only),
                                and what you observed. Request they inquire with DHS on your behalf.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
