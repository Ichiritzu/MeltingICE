'use client';

import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function WarrantChecklist() {
    const checks = [
        { text: 'Is it signed by a JUDGE (not just an ICE officer)?', critical: true },
        { text: 'Does it have YOUR correct address?', critical: true },
        { text: 'Does it list anyone who lives there by name?', critical: true },
        { text: 'Is it a JUDICIAL warrant (not an administrative warrant)?', critical: true },
    ];

    return (
        <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-white">Before Opening the Door</h3>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
                Ask to see a warrant through a window or slipped under the door.
            </p>

            <ul className="space-y-3">
                {checks.map((check, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-zinc-300">{check.text}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-300 italic">
                    "Please slide the warrant under the door so I can read it."
                </p>
            </div>
        </div>
    );
}

export default WarrantChecklist;
