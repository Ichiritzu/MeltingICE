'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Quick Exit Button - Immediately redirects to a neutral site
 * Clears the current page from history to prevent back-button return
 */
export function QuickExitButton({ className = '' }: { className?: string }) {
    const exit = () => {
        // Replace history to prevent back button
        window.location.replace('https://weather.com');
    };

    return (
        <Button
            onClick={exit}
            variant="destructive"
            size="sm"
            className={`font-bold bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg ${className}`}
            title="Quick Exit - Go to weather.com"
        >
            <X className="w-4 h-4 mr-1" /> Exit
        </Button>
    );
}

export default QuickExitButton;
