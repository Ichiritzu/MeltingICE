import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent">
                <FileText className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Privacy</span> Policy
                </h1>
                <p className="text-sm text-[#9ca3af]">Last updated: January 2026</p>
            </section>

            <div className="max-w-3xl mx-auto px-4 py-8">
                <Link href="/settings" className="inline-block mb-6">
                    <Button variant="ghost" size="sm" className="text-[#9ca3af] hover:text-[#f5f0eb]">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Settings
                    </Button>
                </Link>

                <div className="space-y-8 text-[#d4d4d4]">
                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Our Commitment to Privacy</h2>
                        <p className="leading-relaxed">
                            MeltingICE is designed with a <strong>local-first, privacy-by-default</strong> architecture.
                            We believe that community safety tools should protect the communities they serve.
                            Your privacy and safety are our top priorities.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">What We Do NOT Collect</h2>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Personal identification information (names, emails, phone numbers)</li>
                            <li>Exact GPS coordinates (we only use approximate locations)</li>
                            <li>Photos, videos, or evidence attachments (stored locally only)</li>
                            <li>User accounts or login credentials</li>
                            <li>Analytics, tracking cookies, or behavioral data</li>
                            <li>IP addresses or device fingerprints</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Local Data Storage</h2>
                        <p className="leading-relaxed mb-4">
                            All incident reports and evidence you create are stored <strong>locally on your device only</strong>
                            using IndexedDB (browser storage). This data never leaves your device unless you explicitly
                            choose to share it publicly.
                        </p>
                        <p className="leading-relaxed">
                            You can export or delete your local data at any time from the Settings page.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Public Report Submissions</h2>
                        <p className="leading-relaxed mb-4">
                            If you choose to submit a report to the public map, we collect only:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Approximate location (randomized within ~0.5 mile radius)</li>
                            <li>Date and time bucket (not exact timestamps)</li>
                            <li>Activity description (sanitized for personal information)</li>
                            <li>Activity type/tag</li>
                            <li>Optional: publicly-hosted image URL (you provide the URL)</li>
                        </ul>
                        <p className="leading-relaxed mt-4">
                            Public reports require a configurable delay before appearing on the map
                            (default: 30 minutes). Reports remain publicly visible to help document
                            patterns and support community awareness.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Anonymous Voting</h2>
                        <p className="leading-relaxed">
                            When you vote on a report, we use a randomly-generated browser fingerprint
                            (stored locally) to prevent duplicate votes. This fingerprint cannot be linked
                            to your identity and is not used for tracking.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Third-Party Services</h2>
                        <p className="leading-relaxed">
                            We use Stadia Maps for map tiles. Their privacy policy applies to map usage.
                            No user-identifiable data is shared with them.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Contact</h2>
                        <p className="leading-relaxed">
                            For privacy concerns or questions, please contact us through the Community page
                            inquiry form or at <span className="text-[#5ecfcf]">support@meltingice.app</span>.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
