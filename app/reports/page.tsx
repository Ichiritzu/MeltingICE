'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ReportDetailClient from '@/components/features/ReportDetailClient';

function ReportDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return (
            <main className="min-h-screen bg-[#1a1d2e] flex flex-col items-center justify-center gap-4 px-4">
                <div className="text-[#e85d75] text-lg">No report ID specified</div>
                <a href="/" className="text-[#5ecfcf] hover:underline">← Back to Home</a>
            </main>
        );
    }

    return <ReportDetailClient id={id} />;
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-[#1a1d2e] flex items-center justify-center">
                <div className="animate-pulse text-[#9ca3af]">Loading...</div>
            </main>
        }>
            <ReportDetailContent />
        </Suspense>
    );
}
