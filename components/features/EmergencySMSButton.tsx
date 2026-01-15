'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { localDB } from '@/lib/db/indexedDb';
import { MessageSquare, Settings, AlertCircle } from 'lucide-react';

export function EmergencySMSButton() {
    const [contacts, setContacts] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newContact, setNewContact] = useState('');

    const [locationUrl, setLocationUrl] = useState<string>('');

    useEffect(() => {
        loadContacts();
        // Fetch location immediately
        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Create a high-precision Google Maps link
                    setLocationUrl(`https://maps.google.com/?q=${latitude},${longitude}`);
                },
                (err) => console.error('Error fetching location for emergency SMS:', err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, []);

    async function loadContacts() {
        const saved = await localDB.getSetting<string[]>('trusted_contacts');
        if (saved && saved.length > 0) {
            setContacts(saved);
        } else {
            setIsEditing(true);
        }
    }

    async function saveContact() {
        if (!newContact.trim()) return;
        const updated = [...contacts, newContact.trim()];
        await localDB.setSetting('trusted_contacts', updated);
        setContacts(updated);
        setNewContact('');
        setIsEditing(false);
    }

    async function removeContact(index: number) {
        const updated = contacts.filter((_, i) => i !== index);
        await localDB.setSetting('trusted_contacts', updated);
        setContacts(updated);
        if (updated.length === 0) setIsEditing(true);
    }

    const message = encodeURIComponent(
        "🚨 EMERGENCY: I need help. I am being stopped by immigration enforcement. " +
        "Please contact a lawyer or RAICES (210-787-3180)." +
        (locationUrl ? ` My location: ${locationUrl} . ` : " ") +
        "Do NOT approach. Stay safe."
    );

    const smsUrl = `sms:${contacts.join(',')}?body=${message}`;

    if (isEditing) {
        return (
            <div className="bg-zinc-900/60 border border-dashed border-zinc-600 rounded-xl p-4">
                <h3 className="text-sm font-bold text-zinc-300 mb-3">Set Up Emergency Contact</h3>
                <div className="flex gap-2 mb-3">
                    <input
                        type="tel"
                        placeholder="Phone number"
                        value={newContact}
                        onChange={(e) => setNewContact(e.target.value)}
                        className="flex-1 bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <Button size="sm" onClick={saveContact}>Add</Button>
                </div>
                {contacts.length > 0 && (
                    <div className="space-y-2">
                        {contacts.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-zinc-800 rounded px-3 py-2">
                                <span className="text-zinc-300">{c}</span>
                                <button onClick={() => removeContact(i)} className="text-red-400 text-xs">Remove</button>
                            </div>
                        ))}
                        <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setIsEditing(false)}>
                            Done
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <a
                href={smsUrl}
                className="flex items-center justify-center gap-3 w-full py-6 px-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-red-900/30 transition-colors"
            >
                <AlertCircle className="w-6 h-6" />
                EMERGENCY SMS
                <span className="text-sm font-normal opacity-70">({contacts.length} contacts)</span>
            </a>
            <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 w-full py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
            >
                <Settings className="w-4 h-4" /> Edit Contacts
            </button>
        </div>
    );
}

export default EmergencySMSButton;
