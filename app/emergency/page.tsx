'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Resource } from '@/lib/api';
import { KyrCarousel } from '@/components/features/KyrCarousel';
import { ScriptCards } from '@/components/features/ScriptCards';
import { WarrantChecklist } from '@/components/features/WarrantChecklist';
import { EmergencySMSButton } from '@/components/features/EmergencySMSButton';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

// Fallback KYR data in case API fails
const fallbackKyr = [
    { id: 1, title: 'Right to Remain Silent', content: 'You have the right to remain silent.', script: 'I am exercising my right to remain silent.' },
    { id: 2, title: 'Right to Refuse Search', content: 'You do not have to consent to a search.', script: 'I do not consent to a search.' },
    { id: 3, title: 'Right to Leave', content: 'If you are not under arrest, you have the right to calmly leave.', script: 'Am I free to leave?' },
    { id: 4, title: 'Right to Attorney', content: 'If you are arrested, you have the right to a lawyer.', script: 'I want to speak to a lawyer.' },
];

export default function EmergencyPage() {
    const [kyrCards, setKyrCards] = useState<any[]>(fallbackKyr);

    useEffect(() => {
        loadKyr();
    }, []);

    async function loadKyr() {
        try {
            const resources = await api.getResources('kyr') as Resource[];
            if (resources.length > 0) {
                const cards = resources.map(r => ({
                    id: r.id,
                    title: r.title,
                    content: r.content,
                    script: r.metadata?.script,
                    icon: r.metadata?.icon,
                }));
                setKyrCards(cards);
            }
        } catch (e) {
            // Using fallback KYR data
        }
    }

    return (
        <>
            {/* Emergency Banner - Override the regular safety banner */}
            <div className="bg-[#e85d75]/20 border-b border-[#e85d75]/30 px-4 py-2 text-center -mt-10">
                <p className="text-xs text-[#e85d75]">
                    🚨 <strong>EMERGENCY MODE</strong> - Know your rights. Stay calm.
                </p>
            </div>

            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-red-500/10 via-orange-500/5 to-transparent">
                <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Emergency</span> Mode
                </h1>
                <p className="text-[#9ca3af] max-w-md mx-auto text-sm">
                    Know your rights. Stay calm. Use these tools to protect yourself.
                </p>
            </section>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
                {/* Emergency SMS */}
                <section>
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
                        Emergency Alert
                    </h2>
                    <EmergencySMSButton />
                </section>

                {/* Script Cards */}
                <section>
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
                        Quick Scripts
                    </h2>
                    <ScriptCards />
                </section>

                {/* Know Your Rights Carousel */}
                <section>
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
                        Know Your Rights
                    </h2>
                    <KyrCarousel cards={kyrCards} />
                </section>

                {/* Warrant Checklist */}
                <section>
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
                        Warrant Check
                    </h2>
                    <WarrantChecklist />
                </section>

                {/* Quick Links */}
                <section className="grid grid-cols-2 gap-3">
                    <Link href="/report">
                        <Button variant="outline" className="w-full h-16 flex-col gap-1 border-[#3d4358] hover:border-[#5ecfcf] hover:bg-[#5ecfcf]/10">
                            <span className="text-lg">📝</span>
                            <span className="text-xs">Document</span>
                        </Button>
                    </Link>
                    <Link href="/resources">
                        <Button variant="outline" className="w-full h-16 flex-col gap-1 border-[#3d4358] hover:border-[#5ecfcf] hover:bg-[#5ecfcf]/10">
                            <span className="text-lg">📞</span>
                            <span className="text-xs">Hotlines</span>
                        </Button>
                    </Link>
                </section>
            </div>
        </>
    );
}
