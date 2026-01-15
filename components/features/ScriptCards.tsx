'use client';

import { VolumeX, Shield, DoorOpen, Scale } from 'lucide-react';

const scripts = [
    {
        icon: VolumeX,
        title: 'Right to Silence',
        script: 'I am exercising my right to remain silent.',
        color: 'bg-red-600',
    },
    {
        icon: Shield,
        title: 'Refuse Search',
        script: 'I do not consent to a search.',
        color: 'bg-orange-600',
    },
    {
        icon: DoorOpen,
        title: 'Free to Leave?',
        script: 'Am I free to leave?',
        color: 'bg-yellow-600',
    },
    {
        icon: Scale,
        title: 'Right to Attorney',
        script: 'I want to speak to a lawyer.',
        color: 'bg-blue-600',
    },
];

export function ScriptCards() {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Brief visual feedback could be added here
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {scripts.map((s, i) => (
                <button
                    key={i}
                    onClick={() => copyToClipboard(s.script)}
                    className={`${s.color} rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
                >
                    <s.icon className="w-6 h-6 text-white/80 mb-2" />
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1">
                        {s.title}
                    </h4>
                    <p className="text-lg font-bold text-white leading-tight">
                        "{s.script}"
                    </p>
                    <p className="text-[10px] text-white/50 mt-2">Tap to copy</p>
                </button>
            ))}
        </div>
    );
}

export default ScriptCards;
