'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[#1a1d2e] border-t border-white/5 py-8 px-4 mt-auto md:mb-0">
            <div className="max-w-6xl mx-auto">
                {/* Main footer content */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Links</h4>
                        <nav className="flex flex-col gap-2">
                            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Home</Link>
                            <Link href="/emergency" className="text-sm text-zinc-500 hover:text-red-400 transition-colors">Emergency</Link>
                            <Link href="/report" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Report</Link>
                            <Link href="/community" className="text-sm text-zinc-500 hover:text-purple-400 transition-colors">Community</Link>
                        </nav>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Resources</h4>
                        <nav className="flex flex-col gap-2">
                            <Link href="/resources" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Help & Hotlines</Link>
                            <Link href="/resources#legal" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Legal Aid</Link>
                            <Link href="/community#donations" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Donate</Link>
                        </nav>
                    </div>

                    {/* About */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">About</h4>
                        <nav className="flex flex-col gap-2">
                            <Link href="/about" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">About Us</Link>
                            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Privacy</Link>
                        </nav>
                    </div>

                    {/* Emergency */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Hotlines</h4>
                        <div className="flex flex-col gap-2 text-sm text-zinc-500">
                            <a href="tel:2107873180" className="hover:text-zinc-300">RAICES: (210) 787-3180</a>
                            <a href="tel:8449263298" className="hover:text-zinc-300">United We Dream: 844-926-3298</a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-zinc-600">
                        © {new Date().getFullYear()} MeltingICE. Open source community project.
                    </p>
                    <p className="text-xs text-zinc-600 flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500" /> for communities
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
