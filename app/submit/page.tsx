'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, ExternalLink, Copy, Check, ChevronRight, Building2, Scale } from 'lucide-react';

const agencies = [
    {
        id: 'crcl',
        name: 'DHS Civil Rights (CRCL)',
        description: 'For civil rights violations by ICE/CBP',
        url: 'https://www.dhs.gov/file-civil-rights-complaint',
        icon: Scale,
    },
    {
        id: 'trip',
        name: 'DHS TRIP (Traveler Redress)',
        description: 'For border/airport issues or watchlist problems',
        url: 'https://www.dhs.gov/dhs-trip',
        icon: Building2,
    },
    {
        id: 'oig',
        name: 'DHS Office of Inspector General',
        description: 'For fraud, waste, or abuse',
        url: 'https://www.oig.dhs.gov/hotline',
        icon: Building2,
    },
];

const templates = [
    {
        id: 'crcl',
        title: 'CRCL Complaint Template',
        content: `To Whom It May Concern,

I am writing to file a civil rights complaint regarding an incident involving immigration enforcement.

Date of Incident: [DATE]
Time: [TIME]
Location: [CITY, STATE - no exact address]
Agency Involved: [ICE/CBP/Unknown]

Description of Incident:
[Describe what happened. Include any badge numbers if visible, vehicle descriptions, and general behavior observed. Do NOT include personal identifying information of any individuals.]

I believe this incident may constitute a violation of civil rights because:
[Explain your concerns]

I am available to provide additional information if needed.

Sincerely,
[Your contact information - optional]`,
    },
    {
        id: 'congress',
        title: 'Letter to Congress',
        content: `Dear [Representative/Senator Name],

I am a constituent writing to report concerning immigration enforcement activity in our community.

On [DATE], I observed [brief description of incident] in [CITY, STATE].

I urge you to:
1. Investigate this incident and request information from DHS
2. Support policies that protect community members from rights violations
3. Ensure accountability for enforcement agencies

This matter is important to our community's safety and trust in public institutions.

Thank you for your attention.

Sincerely,
[Your name and address]`,
    },
];

export default function SubmitPage() {
    const [step, setStep] = useState<'agencies' | 'templates'>('agencies');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    function copyTemplate(id: string, content: string) {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-green-500/10 via-emerald-500/5 to-transparent">
                <Send className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">File</span> Complaints
                </h1>
                <p className="text-[#9ca3af] max-w-md mx-auto text-sm">
                    Official channels and templates for reporting violations.
                </p>
            </section>

            {/* Tab Navigation */}
            <div className="max-w-lg mx-auto px-4 py-4">
                <div className="flex gap-1 bg-[#242838] rounded-xl p-1">
                    <button
                        onClick={() => setStep('agencies')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${step === 'agencies' ? 'bg-[#3d4358] text-[#f5f0eb]' : 'text-[#9ca3af] hover:text-[#f5f0eb]'
                            }`}
                    >
                        Agencies
                    </button>
                    <button
                        onClick={() => setStep('templates')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${step === 'templates' ? 'bg-[#3d4358] text-[#f5f0eb]' : 'text-[#9ca3af] hover:text-[#f5f0eb]'
                            }`}
                    >
                        Templates
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-2 space-y-6">
                {/* Info Banner */}
                <div className="bg-[#5dd39e]/10 border border-[#5dd39e]/20 rounded-2xl p-4">
                    <p className="text-sm text-[#9ca3af]">
                        <strong className="text-[#5dd39e]">Note:</strong> We cannot submit complaints on your behalf.
                        These are external official channels.
                    </p>
                </div>

                {step === 'agencies' && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">
                            Official Complaint Channels
                        </h2>

                        {agencies.map((agency) => (
                            <a
                                key={agency.id}
                                href={agency.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-[#242838] border border-white/5 rounded-2xl p-4 hover:border-[#5dd39e]/30 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-[#5dd39e]/20 rounded-xl flex items-center justify-center shrink-0">
                                        <agency.icon className="w-5 h-5 text-[#5dd39e]" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#f5f0eb] flex items-center gap-2">
                                            {agency.name}
                                            <ExternalLink className="w-4 h-4 text-[#6b7280]" />
                                        </h3>
                                        <p className="text-sm text-[#9ca3af] mt-1">{agency.description}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[#6b7280]" />
                                </div>
                            </a>
                        ))}

                        <div className="pt-4">
                            <h3 className="text-sm font-bold text-[#6b7280] mb-3">Find Your Representative</h3>
                            <a
                                href="https://www.house.gov/representatives/find-your-representative"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-[#2d3348] hover:bg-[#3d4358] border border-[#3d4358] rounded-xl p-4 transition-colors"
                            >
                                <span className="text-sm text-[#f5f0eb]">House of Representatives</span>
                                <ExternalLink className="w-4 h-4 text-[#5ecfcf]" />
                            </a>
                            <a
                                href="https://www.senate.gov/senators/senators-contact.htm"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-[#2d3348] hover:bg-[#3d4358] border border-[#3d4358] rounded-xl p-4 mt-2 transition-colors"
                            >
                                <span className="text-sm text-[#f5f0eb]">Senate</span>
                                <ExternalLink className="w-4 h-4 text-[#5ecfcf]" />
                            </a>
                        </div>
                    </section>
                )}

                {step === 'templates' && (
                    <section className="space-y-4">
                        <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">
                            Complaint Templates
                        </h2>

                        {templates.map((tpl) => (
                            <div key={tpl.id} className="bg-[#242838] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-white/5">
                                    <h3 className="font-bold text-[#f5f0eb]">{tpl.title}</h3>
                                    <Button
                                        size="sm"
                                        className={copiedId === tpl.id ? 'bg-[#5dd39e] text-white' : 'bg-[#3d4358] text-[#f5f0eb] hover:bg-[#4d5368]'}
                                        onClick={() => copyTemplate(tpl.id, tpl.content)}
                                    >
                                        {copiedId === tpl.id ? (
                                            <><Check className="w-4 h-4 mr-1" /> Copied</>
                                        ) : (
                                            <><Copy className="w-4 h-4 mr-1" /> Copy</>
                                        )}
                                    </Button>
                                </div>
                                <pre className="p-4 text-xs text-[#9ca3af] whitespace-pre-wrap overflow-x-auto max-h-64 bg-[#1a1d2e]">
                                    {tpl.content}
                                </pre>
                            </div>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}
