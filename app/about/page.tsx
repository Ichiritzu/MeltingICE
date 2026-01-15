import Link from 'next/link';
import { Shield, Users, Eye, Heart, MapPin } from 'lucide-react';

export default function AboutPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="py-10 px-4 text-center bg-gradient-to-b from-[#ff7b5f]/10 via-[#ffb347]/5 to-transparent">
                <h1 className="text-4xl md:text-5xl font-black mb-4">
                    About <span className="bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] bg-clip-text text-transparent">MeltingICE</span>
                </h1>
                <p className="text-[#9ca3af] max-w-xl mx-auto">
                    A community-driven platform for transparency, safety, and awareness.
                </p>
            </section>

            {/* Mission Cards */}
            <section className="max-w-6xl mx-auto px-4 py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Real-Time Tracking */}
                <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 h-full flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl flex items-center justify-center mb-3">
                        <Eye className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#f5f0eb]">Real-Time Tracking</h3>
                    <p className="text-sm text-[#9ca3af] flex-1">
                        Live mapping of user-submitted reports to keep communities informed instantly.
                    </p>
                </div>

                {/* Community Powered */}
                <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 h-full flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#f5f0eb]">Community Powered</h3>
                    <p className="text-sm text-[#9ca3af] flex-1">
                        Crowdsourced verification ensures data accuracy. We rely on the vigilance of our neighbors.
                    </p>
                </div>

                {/* Safety First */}
                <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 h-full flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-3">
                        <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#f5f0eb]">Safety First</h3>
                    <p className="text-sm text-[#9ca3af] flex-1">
                        Built with privacy at its core. We do not track user identities.
                    </p>
                </div>

                {/* Open Source */}
                <div className="bg-[#242838] border border-white/5 rounded-2xl p-5 h-full flex flex-col">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
                        <Heart className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-[#f5f0eb]">Open Source</h3>
                    <p className="text-sm text-[#9ca3af] flex-1">
                        Transparent code ensures our platform remains a trusted tool for public service.
                    </p>
                </div>
            </section>

            {/* Why This Exists */}
            <section className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-[#242838] border border-white/5 rounded-2xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-[#f5f0eb] mb-4 flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-[#ff7b5f]" />
                        Why This Exists
                    </h2>
                    <div className="space-y-4 text-[#9ca3af]">
                        <p>
                            Information is power. In times of uncertainty, accurate and timely information can mean the difference between safety and separation. MeltingICE was created to level the playing field, giving communities the tools they need to protect themselves.
                        </p>
                        <p>
                            This platform is <strong className="text-[#f5f0eb]">not affiliated with any government agency</strong>. It is a public service tool built by and for the people.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-4 py-12 text-center">
                <h2 className="text-2xl font-bold text-[#f5f0eb] mb-6">Get Involved</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/community"
                        className="px-8 py-3 bg-gradient-to-r from-[#ff7b5f] to-[#ffb347] hover:from-[#ff8f77] hover:to-[#ffc066] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff7b5f]/20"
                    >
                        Join the Community
                    </Link>
                    <Link
                        href="/emergency"
                        className="px-8 py-3 bg-[#242838] hover:bg-[#2d3348] border border-white/10 text-white font-bold rounded-xl transition-colors"
                    >
                        Emergency Resources
                    </Link>
                </div>
            </section>
        </>
    );
}
