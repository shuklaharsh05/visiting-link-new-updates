import Header from "../components/sections/Header";
import Footer from "../components/sections/Footer";

export default function TermsAndConditions() {
    return (
      <>
      <Header />
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 lg:px-20 pb-10 pt-28 lg:pt-36 text-slate-800 bg-gray-50">
        <h1 className="text-2xl lg:text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-slate-500 mb-6">Effective Date: 26 Feb</p>
  
        <p className="mb-4">
          Welcome to <strong>VisitingLink</strong> (“Company”, “we”, “our”, or “us”). These Terms &amp;
          Conditions govern your access and use of our website{" "}
          <a href="https://www.visitinglink.com/" className="text-blue-600 underline">
            https://www.visitinglink.com/
          </a>{" "}
          and all services provided through the platform.
        </p>
        <p className="mb-6">
          By accessing or using our website and services, you agree to be bound by these Terms.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">1. About VisitingLink</h2>
        <p className="mb-6">
          VisitingLink is a digital platform that enables individuals and businesses to create smart
          digital visiting cards, business profiles, QR-enabled identity pages, NFC-based contact
          sharing solutions, and related digital networking tools.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">2. Acceptance of Terms</h2>
        <p className="mb-2">By using this website, you confirm that:</p>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>You are at least 18 years old.</li>
          <li>You agree to comply with all applicable laws.</li>
          <li>You accept these Terms &amp; Conditions fully.</li>
        </ul>
        <p className="mb-6">
          If you do not agree, please discontinue use of the website.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">3. User Account</h2>
        <p className="mb-2">To access certain services, users may need to create an account. Users agree to:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Provide accurate registration information.</li>
          <li>Maintain confidentiality of login credentials.</li>
          <li>Accept responsibility for all account activity.</li>
        </ul>
        <p className="mb-6">
          VisitingLink reserves the right to suspend or terminate accounts suspected of misuse.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">4. Services Provided</h2>
        <p className="mb-2">Through VisitingLink, users may:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Create digital business profiles</li>
          <li>Generate QR-based visiting cards</li>
          <li>Use NFC-enabled smart cards</li>
          <li>Share contact &amp; business information</li>
          <li>Access profile analytics and dashboard tools</li>
        </ul>
        <p className="mb-6">
          We reserve the right to modify, update, or discontinue services at any time.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">5. Orders &amp; Payments</h2>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Certain products or services require payment.</li>
          <li>All prices displayed on the website are subject to change.</li>
          <li>Payments once completed are generally non-refundable, unless stated otherwise.</li>
          <li>Physical products such as NFC cards cannot be cancelled after production begins.</li>
        </ul>
  
        <h2 className="text-xl font-semibold mb-2">6. User Content</h2>
        <p className="mb-2">Users may upload information including:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Name</li>
          <li>Contact details</li>
          <li>Business information</li>
          <li>Social links</li>
          <li>Images or branding materials</li>
        </ul>
        <p className="mb-2">You confirm that:</p>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>You own or have rights to the content uploaded.</li>
          <li>Content does not violate any law or third-party rights.</li>
        </ul>
        <p className="mb-6">
          VisitingLink reserves the right to remove inappropriate or unlawful content.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">7. Prohibited Use</h2>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Use the platform for illegal or fraudulent purposes.</li>
          <li>Upload harmful, abusive, misleading, or offensive material.</li>
          <li>Attempt unauthorized access to systems.</li>
          <li>Distribute spam or malware through profiles.</li>
        </ul>
  
        <h2 className="text-xl font-semibold mb-2">8. Intellectual Property</h2>
        <p className="mb-6">
          All website content including logo, software, design, technology, and branding is owned by
          VisitingLink and protected under applicable intellectual property laws. Unauthorized
          reproduction or copying is prohibited.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">9. Service Availability</h2>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>We aim to provide uninterrupted access; however, availability is not guaranteed.</li>
          <li>Maintenance or technical issues may cause temporary downtime.</li>
        </ul>
  
        <h2 className="text-xl font-semibold mb-2">10. Limitation of Liability</h2>
        <p className="mb-2">VisitingLink shall not be liable for:</p>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Loss of business opportunities.</li>
          <li>Unauthorized use of shared contact information.</li>
          <li>Third-party misuse of publicly shared profiles.</li>
          <li>Technical interruptions beyond our control.</li>
        </ul>
  
        <h2 className="text-xl font-semibold mb-2">11. Third-Party Links</h2>
        <p className="mb-6">
          User profiles may contain links to external websites. VisitingLink is not responsible for
          third-party content, services, or privacy practices.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">12. Privacy</h2>
        <p className="mb-6">
          Use of the platform is also governed by our Privacy Policy, available on the website.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">13. Termination</h2>
        <p className="mb-6">
          We reserve the right to suspend accounts, remove profiles, or restrict access if users
          violate these Terms.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">14. Changes to Terms</h2>
        <p className="mb-6">
          VisitingLink may update these Terms periodically. Continued use of the website after updates
          indicates acceptance of revised Terms.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">15. Governing Law &amp; Jurisdiction</h2>
        <p className="mb-6">
          These Terms shall be governed by the laws of India, and disputes shall fall under the
          jurisdiction of courts located in Jhansi, Uttar Pradesh.
        </p>
  
        <h2 className="text-xl font-semibold mb-2">16. Contact Us</h2>
        <p className="mb-1">
          <strong>VisitingLink</strong>
        </p>
        <p className="mb-1">
          Website:{" "}
          <a href="https://www.visitinglink.com/" className="text-blue-600 underline">
            https://www.visitinglink.com/
          </a>
        </p>
        <p className="mb-10">Email: <a href="mailto:support@visitinglink.com" className="text-blue-600 underline">support@visitinglink.com</a></p>
      </div>
      <Footer />
      </>
    );
  }