import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <>
            {/* Hero */}
            <section className="py-8 px-4 text-center bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent">
                <Scale className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h1 className="text-3xl font-black mb-2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Terms</span> of Service
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
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Acceptance of Terms</h2>
                        <p className="leading-relaxed">
                            By using MeltingICE (&quot;the Service&quot;), you agree to these Terms of Service.
                            If you do not agree, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Purpose of the Service</h2>
                        <p className="leading-relaxed">
                            MeltingICE is a community safety tool designed to help individuals document
                            and share reports of immigration enforcement activity. The Service is intended
                            for <strong>informational and community awareness purposes only</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">User Responsibilities</h2>
                        <p className="leading-relaxed mb-4">By using this Service, you agree to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Submit only truthful, good-faith reports of activity you have personally witnessed</li>
                            <li>Not include personally identifiable information (names, addresses, license plates) in reports</li>
                            <li>Not use the Service to harass, target, or endanger any individuals</li>
                            <li>Not submit false, misleading, or spam content</li>
                            <li>Respect the safety and privacy of all community members</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Content Moderation</h2>
                        <p className="leading-relaxed">
                            Public reports are subject to community voting and flagging. Reports with low
                            confidence scores or multiple flags may be reviewed and removed. We reserve
                            the right to remove any content that violates these terms or poses safety concerns.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Disclaimer of Liability</h2>
                        <p className="leading-relaxed mb-4">
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>The accuracy, completeness, or timeliness of any reports</li>
                            <li>Continuous, uninterrupted access to the Service</li>
                            <li>That the Service will meet your specific needs</li>
                        </ul>
                        <p className="leading-relaxed mt-4">
                            <strong>Do not rely solely on this Service for safety decisions.</strong> Always
                            prioritize your personal safety and consult with legal professionals for
                            immigration-related matters.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Safety Notice</h2>
                        <div className="bg-[#e85d75]/20 border border-[#e85d75]/30 rounded-lg p-4">
                            <p className="text-[#e85d75] font-medium">
                                ⚠️ Do not approach, interfere with, or obstruct law enforcement activities.
                                Your safety is the priority. Document from a safe distance only.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Limitation of Liability</h2>
                        <p className="leading-relaxed">
                            To the maximum extent permitted by law, the operators of MeltingICE shall
                            not be liable for any direct, indirect, incidental, consequential, or punitive
                            damages arising from your use of or inability to use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Changes to Terms</h2>
                        <p className="leading-relaxed">
                            We may update these terms at any time. Continued use of the Service after
                            changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-3 text-[#f5f0eb]">Contact</h2>
                        <p className="leading-relaxed">
                            For questions about these terms, please contact us at{' '}
                            <span className="text-[#5ecfcf]">support@meltingice.app</span>.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
