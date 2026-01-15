'use client';

import Link from 'next/link';
import { localDB } from '@/lib/db/indexedDb';
import { WipeButton } from '@/components/ui/WipeButton';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Download, CheckCircle2, FileText, Scale } from 'lucide-react';

export default function SettingsPage() {
    async function exportData() {
        try {
            const data = await localDB.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meltingice-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed');
        }
    }

    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-zinc-500/10 via-zinc-500/5 to-transparent">
                <Settings className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-zinc-400 to-zinc-300 bg-clip-text text-transparent">Settings</span>
                </h1>
            </section>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
                {/* Security Info */}
                <section className="bg-[#242838] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                        <Shield className="w-8 h-8 text-[#5dd39e] shrink-0" />
                        <div>
                            <h2 className="font-bold text-[#f5f0eb] mb-2">Local-First Privacy</h2>
                            <ul className="text-sm text-[#9ca3af] space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#5dd39e] shrink-0 mt-0.5" />
                                    All incident data stored only on this device
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#5dd39e] shrink-0 mt-0.5" />
                                    Evidence (photos) never uploaded
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#5dd39e] shrink-0 mt-0.5" />
                                    Public reports are sanitized (no exact locations)
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#5dd39e] shrink-0 mt-0.5" />
                                    No accounts, no tracking, no analytics
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Data Management */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">
                        Data Management
                    </h2>

                    <Button
                        variant="outline"
                        className="w-full justify-start border-[#3d4358] hover:border-[#5ecfcf] hover:bg-[#5ecfcf]/10"
                        onClick={exportData}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export All Data (JSON)
                    </Button>

                    <WipeButton className="w-full justify-start" />
                </section>

                {/* Legal */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold text-[#9ca3af] uppercase tracking-wider">
                        Legal
                    </h2>

                    <div className="space-y-2">
                        <Link href="/privacy">
                            <Button
                                variant="outline"
                                className="w-full justify-start border-[#3d4358] hover:border-[#5ecfcf] hover:bg-[#5ecfcf]/10"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Privacy Policy
                            </Button>
                        </Link>
                        <Link href="/terms">
                            <Button
                                variant="outline"
                                className="w-full justify-start border-[#3d4358] hover:border-[#5ecfcf] hover:bg-[#5ecfcf]/10"
                            >
                                <Scale className="w-4 h-4 mr-2" /> Terms of Service
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* About */}
                <section className="text-center pt-8 border-t border-white/5">
                    <p className="text-xs text-[#6b7280]">MeltingICE</p>
                    <p className="text-xs text-[#6b7280] mt-1">Community Safety Hub</p>
                </section>
            </div>
        </>
    );
}
