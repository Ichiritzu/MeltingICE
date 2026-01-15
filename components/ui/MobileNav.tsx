'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, FileText, ShieldAlert, MoreHorizontal, X, Users, BookOpen, Send, Settings } from 'lucide-react';

interface MobileNavProps {
    activePage?: 'home' | 'report' | 'emergency' | 'community' | 'resources' | 'submit' | 'settings';
}

export function MobileNav({ activePage = 'home' }: MobileNavProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getColor = (page: string) => activePage === page ? 'text-[#ff7b5f]' : 'text-[#9ca3af]';

    return (
        <>
            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d2e]/95 backdrop-blur-md border-t border-white/5 px-4 py-2 z-50">
                <div className="flex justify-around">
                    <Link href="/" className={`flex flex-col items-center text-xs ${getColor('home')} hover:text-[#ff7b5f]`}>
                        <Home className="w-5 h-5 mb-1" /> Home
                    </Link>
                    <Link href="/report" className={`flex flex-col items-center text-xs ${getColor('report')} hover:text-[#ff7b5f]`}>
                        <FileText className="w-5 h-5 mb-1" /> Report
                    </Link>
                    <Link href="/emergency" className={`flex flex-col items-center text-xs ${getColor('emergency')} hover:text-red-400`}>
                        <ShieldAlert className="w-5 h-5 mb-1" /> Emergency
                    </Link>
                    <button onClick={() => setShowMenu(true)} className="flex flex-col items-center text-[#9ca3af] text-xs hover:text-[#f5f0eb]">
                        <MoreHorizontal className="w-5 h-5 mb-1" /> More
                    </button>
                </div>
            </nav>

            {/* Mobile More Menu */}
            {showMenu && (
                <div className="md:hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-[#1a1d2e] border-t border-white/10 rounded-t-3xl p-6 animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">More</h3>
                            <button onClick={() => setShowMenu(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Link href="/community" onClick={() => setShowMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Users className="w-6 h-6 text-purple-400 mb-2" />
                                <span className="text-sm">Community</span>
                            </Link>
                            <Link href="/resources" onClick={() => setShowMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <BookOpen className="w-6 h-6 text-teal-400 mb-2" />
                                <span className="text-sm">Resources</span>
                            </Link>
                            <Link href="/submit" onClick={() => setShowMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Send className="w-6 h-6 text-green-400 mb-2" />
                                <span className="text-sm">Submit</span>
                            </Link>
                            <Link href="/settings" onClick={() => setShowMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Settings className="w-6 h-6 text-zinc-400 mb-2" />
                                <span className="text-sm">Settings</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
