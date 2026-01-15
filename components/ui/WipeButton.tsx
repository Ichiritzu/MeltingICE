'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { localDB } from '@/lib/db/indexedDb';
import { useRouter } from 'next/navigation';

/**
 * Wipe Button - Deletes all local data from IndexedDB
 */
export function WipeButton({ className = '' }: { className?: string }) {
    const router = useRouter();

    const handleWipe = async () => {
        const confirmed = confirm(
            '⚠️ DELETE ALL LOCAL DATA?\n\n' +
            'This will permanently erase:\n' +
            '• All incident drafts\n' +
            '• All photos/videos\n' +
            '• All settings\n\n' +
            'This cannot be undone.'
        );

        if (confirmed) {
            try {
                await localDB.deleteEverything();
                alert('All data has been deleted.');
                router.push('/');
                router.refresh();
            } catch (error) {
                console.error('Wipe error:', error);
                alert('Failed to delete data. Please try again.');
            }
        }
    };

    return (
        <Button
            onClick={handleWipe}
            variant="outline"
            className={`text-red-500 border-red-500/30 hover:bg-red-500/10 ${className}`}
        >
            <Trash2 className="w-4 h-4 mr-2" /> Delete All Data
        </Button>
    );
}

export default WipeButton;
