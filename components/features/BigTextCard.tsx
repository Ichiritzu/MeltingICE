
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BigTextCardProps {
    title: string;
    script: string;
    className?: string;
    variant?: 'default' | 'urgent';
}

export function BigTextCard({ title, script, className, variant = 'default' }: BigTextCardProps) {
    return (
        <Card className={cn(
            "w-full cursor-pointer transition-all active:scale-[0.98] group overflow-hidden border-white/5",
            variant === 'urgent'
                ? 'bg-amber-950/30 border-amber-500/30 hover:bg-amber-900/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                : 'hover:bg-zinc-800/60',
            className
        )}>
            <CardHeader>
                <CardTitle className={cn(
                    "text-sm uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r",
                    variant === 'urgent' ? 'from-amber-200 to-amber-500' : 'from-zinc-400 to-zinc-600'
                )}>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={cn(
                    "text-2xl md:text-4xl font-black leading-tight tracking-tight group-hover:scale-[1.01] transition-transform duration-300",
                    variant === 'urgent' ? 'text-amber-100 text-glow-red' : 'text-white'
                )}>
                    "{script}"
                </p>
            </CardContent>
        </Card>
    );
}
