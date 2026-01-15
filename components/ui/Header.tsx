'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/emergency', label: 'Emergency' },
        { href: '/report', label: 'Report' },
        { href: '/community', label: 'Community', hoverColor: 'hover:text-purple-400' },
        { href: '/resources', label: 'Resources' },
        { href: '/about', label: 'About' },
    ];

    return (
        <header className="sticky top-0 z-[9999] bg-[#1a1d2e]/95 backdrop-blur-md border-b border-white/5">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="flex items-center relative">
                    <Image
                        src="/meltingice_logo.png"
                        alt="MeltingICE"
                        width={280}
                        height={80}
                        className="h-20 w-auto -my-6"
                        priority
                    />
                </Link>

                <nav className="hidden md:flex items-center gap-6 text-sm">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`transition-colors ${isActive
                                        ? 'text-[#f5f0eb] font-medium'
                                        : `text-[#9ca3af] ${item.hoverColor || 'hover:text-[#5ecfcf]'}`
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon" className="text-[#9ca3af] hover:text-[#f5f0eb]">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default Header;
