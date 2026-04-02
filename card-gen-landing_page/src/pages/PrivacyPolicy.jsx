import Header from "../components/sections/Header";
import Footer from "../components/sections/Footer";

export default function PrivacyPolicy() {
    return (
        <>
            <Header />
            <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 lg:px-20 pb-10 pt-28 lg:pt-36 text-slate-800 bg-gray-50">
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mb-6">Effective Date: 26 Feb</p>

                <p className="mb-4">
                    <strong>VisitingLink</strong> (“we”, “our”, or “us”) operates the website{" "}
                    <a
                        href="https://www.visitinglink.com/"
                        className="text-blue-600 underline"
                    >
                        https://www.visitinglink.com/
                    </a>{" "}
                    and provides digital business identity and smart networking solutions.
                </p>
                <p className="mb-6">
                    This Privacy Policy explains how we collect, use, store, and protect your
                    information when you use our website and services.
                </p>
                <p className="mb-6">
                    By accessing or using VisitingLink, you agree to this Privacy Policy.
                </p>

                <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
                <h3 className="font-medium mb-1">a) Personal Information</h3>
                <p className="mb-2">When you register or use our services, we may collect:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>Name</li>
                    <li>Phone number</li>
                    <li>Email address</li>
                    <li>Business information</li>
                    <li>Profile details</li>
                    <li>Social media links</li>
                    <li>Billing &amp; shipping information</li>
                </ul>

                <h3 className="font-medium mb-1">b) Automatically Collected Information</h3>
                <p className="mb-2">We may automatically collect:</p>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                    <li>IP address</li>
                    <li>Device type</li>
                    <li>Browser information</li>
                    <li>Location data (approximate)</li>
                    <li>Website usage behavior</li>
                    <li>Cookies &amp; analytics data</li>
                </ul>

                <h3 className="font-medium mb-1">c) Payment Information</h3>
                <p className="mb-2">
                    Payments are processed through secure third-party payment gateways.
                </p>
                <p className="mb-4">VisitingLink does not store:</p>
                <ul className="list-disc pl-5 mb-6 space-y-1">
                    <li>Card numbers</li>
                    <li>CVV details</li>
                    <li>Banking credentials</li>
                </ul>

                <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
                <p className="mb-2">We use collected information to:</p>
                <ul className="list-disc pl-5 mb-6 space-y-1">
                    <li>Create and manage your digital profile</li>
                    <li>Provide QR &amp; NFC services</li>
                    <li>Process orders and payments</li>
                    <li>Improve platform performance</li>
                    <li>Provide customer support</li>
                    <li>Send service updates or notifications</li>
                    <li>Prevent fraud or misuse</li>
                </ul>

                <h2 className="text-xl font-semibold mb-2">3. Public Profile Information</h2>
                <p className="mb-2">
                    Information added to your VisitingLink profile may be publicly accessible when
                    shared via:
                </p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>QR code</li>
                    <li>NFC card</li>
                    <li>Profile link</li>
                </ul>
                <p className="mb-6">
                    You control what information you choose to display publicly.
                </p>

                <h2 className="text-xl font-semibold mb-2">4. Cookies &amp; Tracking Technologies</h2>
                <p className="mb-2">We use cookies to:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>Improve user experience</li>
                    <li>Analyze traffic and performance</li>
                    <li>Remember login sessions</li>
                </ul>
                <p className="mb-6">
                    Users may disable cookies through browser settings; however, some features may
                    not function properly.
                </p>

                <h2 className="text-xl font-semibold mb-2">5. Sharing of Information</h2>
                <p className="mb-2">We do not sell or rent user data.</p>
                <p className="mb-2">Information may be shared only with:</p>
                <ul className="list-disc pl-5 mb-6 space-y-1">
                    <li>Payment gateway partners</li>
                    <li>Hosting &amp; technical service providers</li>
                    <li>Legal authorities when required by law</li>
                </ul>

                <h2 className="text-xl font-semibold mb-2">6. Data Security</h2>
                <p className="mb-2">We implement reasonable security measures including:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>Secure servers</li>
                    <li>Encrypted connections (SSL)</li>
                    <li>Restricted data access</li>
                </ul>
                <p className="mb-6">
                    However, no online platform can guarantee absolute security.
                </p>

                <h2 className="text-xl font-semibold mb-2">7. Data Retention</h2>
                <p className="mb-2">We retain user data:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>As long as the account remains active, or</li>
                    <li>As required for legal or operational purposes.</li>
                </ul>
                <p className="mb-6">
                    Users may request deletion of their account anytime.
                </p>

                <h2 className="text-xl font-semibold mb-2">8. User Rights</h2>
                <p className="mb-2">You may:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>Access your personal data</li>
                    <li>Update profile information</li>
                    <li>Request correction or deletion</li>
                    <li>Withdraw consent where applicable</li>
                </ul>
                <p className="mb-6">
                    Requests can be made via email support.
                </p>

                <h2 className="text-xl font-semibold mb-2">9. Third-Party Services</h2>
                <p className="mb-2">
                    VisitingLink may integrate third-party tools such as:
                </p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                    <li>Payment gateways</li>
                    <li>Analytics services</li>
                    <li>External links added by users</li>
                </ul>
                <p className="mb-6">
                    We are not responsible for third-party privacy practices.
                </p>

                <h2 className="text-xl font-semibold mb-2">10. Children’s Privacy</h2>
                <p className="mb-6">
                    VisitingLink services are not intended for individuals under 18 years of age.
                    We do not knowingly collect data from minors.
                </p>

                <h2 className="text-xl font-semibold mb-2">11. Policy Updates</h2>
                <p className="mb-6">
                    We may update this Privacy Policy periodically. Changes will be reflected with
                    an updated effective date.
                </p>

                <h2 className="text-xl font-semibold mb-2">12. Contact Information</h2>
                <p className="mb-1">
                    <strong>VisitingLink</strong>
                </p>
                <p className="mb-1">
                    Website:{" "}
                    <a
                        href="https://www.visitinglink.com/"
                        className="text-blue-600 underline"
                    >
                        https://www.visitinglink.com/
                    </a>
                </p>
                <p className="mb-10">Email: <a href="mailto:support@visitinglink.com" className="text-blue-600 underline">support@visitinglink.com</a></p>
            </div>
            <Footer />
        </>
    );
}