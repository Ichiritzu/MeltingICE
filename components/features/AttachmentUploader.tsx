
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { db } from "@/lib/idb";
import { AttachmentMeta } from "@/types";
import { Camera, FileVideo, Loader2, Trash2 } from "lucide-react";
import Image from 'next/image';

interface AttachmentUploaderProps {
    incidentId: string;
    attachments?: AttachmentMeta[];
    onUploadComplete: (ref: AttachmentMeta) => void;
}

export function AttachmentUploader({ incidentId, attachments = [], onUploadComplete }: AttachmentUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);

        const file = e.target.files[0];
        const isImage = file.type.startsWith('image/');

        try {
            let finalBlob: Blob | File = file;
            let stripped = false;

            // Simple privacy strip for images via canvas (re-encode)
            if (isImage) {
                finalBlob = await stripImageMetadata(file);
                stripped = true;
            }

            const id = crypto.randomUUID();
            const ref: AttachmentMeta = {
                id,
                type: isImage ? 'image' : 'video',
                original_name: file.name,
                mime_type: isImage ? 'image/jpeg' : file.type, // Canvas exports as jpeg/png
                size: finalBlob.size,
                stripped,
                created_at: Date.now(),
            };

            // Store heavy blob in separate store
            await db.addAttachment({
                id,
                incident_id: incidentId,
                blob: finalBlob,
                type: ref.type,
                created_at: Date.now(),
            });

            // We need to update the incident with the reference
            // This is passed up or handled via a callback that reloads the incident?
            // Better to pass the ref back up
            onUploadComplete(ref);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to process file.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {/* Helper Upload Buttons */}
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                    <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-xs text-zinc-500 font-medium">Add Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
                </label>

                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                    <FileVideo className="w-8 h-8 text-zinc-400 mb-2" />
                    <span className="text-xs text-zinc-500 font-medium">Add Video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={uploading} />
                </label>
            </div>

            {uploading && <div className="flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="animate-spin w-4 h-4" /> Processing... DO NOT CLOSE</div>}

            {/* List */}
            <div className="space-y-2">
                {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center shrink-0">
                                {att.type === 'image' ? <Camera className="w-5 h-5 text-zinc-500" /> : <FileVideo className="w-5 h-5 text-zinc-500" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm text-zinc-200 truncate">{att.original_name}</p>
                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                    {(att.size / 1024 / 1024).toFixed(2)} MB
                                    {att.stripped && <span className="text-green-500 bg-green-950/30 px-1 rounded text-[10px]">Cleaned</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function stripImageMetadata(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        const url = URL.createObjectURL(file);
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('No context')); return; }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(url);
                if (blob) resolve(blob);
                else reject(new Error('Canvas export failed'));
            }, 'image/jpeg', 0.85); // Re-encode as JPEG 85%
        };
        img.onerror = () => reject(new Error('Image load failed'));
    });
}
