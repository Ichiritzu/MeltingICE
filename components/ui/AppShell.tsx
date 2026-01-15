'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, ShieldAlert, MoreHorizontal, X, Users, BookOpen, Send, Settings, Info } from 'lucide-react';
import Header from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Don't show header/footer on admin pages or report edit page (has own focused UI)
    const isAdminPage = pathname?.startsWith('/admin');
    const isReportEditPage = pathname?.startsWith('/report/edit');
    if (isAdminPage || isReportEditPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-[#1a1d2e] text-[#f5f0eb] flex flex-col">
            {/* Safety Banner */}
            <div className="bg-[#ffb347]/10 border-b border-[#ffb347]/30 px-4 py-2 text-center">
                <p className="text-xs text-[#ffb347]">
                    ⚠️ <strong>Do not approach. Do not interfere. Stay safe.</strong>
                </p>
            </div>

            {/* Universal Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1 pb-16 md:pb-0">
                {children}
            </main>

            {/* Universal Footer */}
            <Footer />

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d2e]/95 backdrop-blur-md border-t border-white/5 px-4 py-2 z-50">
                <div className="flex justify-around">
                    <Link href="/" className={`flex flex-col items-center text-xs ${pathname === '/' ? 'text-[#ff7b5f]' : 'text-[#9ca3af] hover:text-[#5ecfcf]'}`}>
                        <Home className="w-5 h-5 mb-1" /> Home
                    </Link>
                    <Link href="/report" className={`flex flex-col items-center text-xs ${pathname?.startsWith('/report') ? 'text-[#ff7b5f]' : 'text-[#9ca3af] hover:text-[#5ecfcf]'}`}>
                        <FileText className="w-5 h-5 mb-1" /> Report
                    </Link>
                    <Link href="/emergency" className={`flex flex-col items-center text-xs ${pathname === '/emergency' ? 'text-red-400' : 'text-[#9ca3af] hover:text-red-400'}`}>
                        <ShieldAlert className="w-5 h-5 mb-1" /> Emergency
                    </Link>
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        className="flex flex-col items-center text-[#9ca3af] text-xs hover:text-[#f5f0eb]"
                    >
                        <MoreHorizontal className="w-5 h-5 mb-1" /> More
                    </button>
                </div>
            </nav>

            {/* Mobile More Menu */}
            {showMobileMenu && (
                <div className="md:hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-[#1a1d2e] border-t border-white/10 rounded-t-3xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">More</h3>
                            <button onClick={() => setShowMobileMenu(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Link href="/community" onClick={() => setShowMobileMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Users className="w-6 h-6 text-purple-400 mb-2" />
                                <span className="text-sm">Community</span>
                            </Link>
                            <Link href="/resources" onClick={() => setShowMobileMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <BookOpen className="w-6 h-6 text-teal-400 mb-2" />
                                <span className="text-sm">Resources</span>
                            </Link>
                            <Link href="/submit" onClick={() => setShowMobileMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Send className="w-6 h-6 text-green-400 mb-2" />
                                <span className="text-sm">Submit</span>
                            </Link>
                            <Link href="/about" onClick={() => setShowMobileMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Info className="w-6 h-6 text-cyan-400 mb-2" />
                                <span className="text-sm">About</span>
                            </Link>
                            <Link href="/settings" onClick={() => setShowMobileMenu(false)} className="flex flex-col items-center p-4 bg-[#242838] rounded-xl hover:bg-[#2a2f42]">
                                <Settings className="w-6 h-6 text-zinc-400 mb-2" />
                                <span className="text-sm">Settings</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppShell;
