'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KyrCard {
    id: number;
    title: string;
    content: string;
    script?: string;
    icon?: string;
}

interface KyrCarouselProps {
    cards: KyrCard[];
}

export function KyrCarousel({ cards }: KyrCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (cards.length === 0) return null;

    const goTo = (index: number) => {
        if (index < 0) setCurrentIndex(cards.length - 1);
        else if (index >= cards.length) setCurrentIndex(0);
        else setCurrentIndex(index);
    };

    const current = cards[currentIndex];

    return (
        <div className="relative">
            {/* Card */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 min-h-[200px] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{current.title}</h3>
                </div>

                <p className="text-zinc-300 text-sm flex-1">{current.content}</p>

                {current.script && (
                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-blue-300 mb-1">Say this:</p>
                        <p className="text-lg font-bold text-white">"{current.script}"</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
                <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>

                <div className="flex gap-1">
                    {cards.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-blue-500' : 'bg-zinc-600'
                                }`}
                        />
                    ))}
                </div>

                <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

export default KyrCarousel;
