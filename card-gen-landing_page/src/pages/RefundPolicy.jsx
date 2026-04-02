import Header from "../components/sections/Header";
import Footer from "../components/sections/Footer";

export default function RefundPolicy() {
  return (
    <>
      <Header />
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 lg:px-20 pb-10 pt-28 lg:pt-36 text-slate-800 bg-gray-50">
        {/* Refund & Cancellation Policy */}
        <h1 className="text-2xl lg:text-4xl font-bold mb-2">
          Refund &amp; Cancellation Policy
        </h1>
        <p className="text-sm text-slate-500 mb-6">Effective Date: 26 Feb</p>

        <p className="mb-4">
          At <strong>VisitingLink</strong>, we strive to deliver high-quality digital and
          physical products. This Refund &amp; Cancellation Policy explains the terms
          applicable to purchases made through{" "}
          <a
            href="https://www.visitinglink.com/"
            className="text-blue-600 underline"
          >
            https://www.visitinglink.com/
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mb-2">1. Digital Services</h2>
        <p className="mb-2">Digital services include:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Digital visiting cards</li>
          <li>Online business profiles</li>
          <li>Subscription services</li>
          <li>QR profile activation</li>
          <li>Platform access features</li>
        </ul>
        <p className="mb-6">
          ✅ Once a digital profile or service is activated, payments are{" "}
          <strong>non-refundable</strong>.
        </p>

        <h2 className="text-xl font-semibold mb-2">2. Physical Products (NFC Cards)</h2>
        <p className="mb-2">
          Orders for physical products such as NFC-enabled cards:
        </p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Cannot be cancelled once production or customization has started.</li>
          <li>
            Are eligible for replacement only if:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Product arrives damaged, or</li>
              <li>Wrong product is delivered.</li>
            </ul>
          </li>
        </ul>
        <p className="mb-6">
          Issues must be reported within <strong>48 hours</strong> of delivery.
        </p>

        <h2 className="text-xl font-semibold mb-2">3. Order Cancellation</h2>
        <p className="mb-2">
          Orders may be cancelled only before processing or printing begins.
        </p>
        <p className="mb-6">
          To request cancellation:{" "}
          <a
            href="mailto:support@visitinglink.com"
            className="text-blue-600 underline"
          >
            support@visitinglink.com
          </a>
        </p>

        <h2 className="text-xl font-semibold mb-2">4. Refund Processing</h2>
        <p className="mb-2">If approved:</p>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Refunds are processed within 7–10 business days.</li>
          <li>Refunds are credited via the original payment method.</li>
        </ul>

        <h2 className="text-xl font-semibold mb-2">5. Non-Refundable Situations</h2>
        <p className="mb-2">Refunds will not be issued for:</p>
        <ul className="list-disc pl-5 mb-8 space-y-1">
          <li>Change of mind after activation</li>
          <li>Incorrect information submitted by user</li>
          <li>Delay caused by courier partners</li>
          <li>Misuse of services</li>
        </ul>

        {/* Shipping & Delivery Policy */}
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-sm text-slate-500 mb-6">Effective Date: [Insert Date]</p>

        <p className="mb-4">
          This policy applies to all physical product orders placed via{" "}
          <a
            href="https://www.visitinglink.com/"
            className="text-blue-600 underline"
          >
            https://www.visitinglink.com/
          </a>
          .
        </p>

        <h2 className="text-xl font-semibold mb-2">1. Order Processing</h2>
        <ul className="list-disc pl-5 mb-6 space-y-1">
          <li>Orders are processed within 2–5 working days after confirmation.</li>
          <li>Customized NFC cards require production time.</li>
        </ul>

        <h2 className="text-xl font-semibold mb-2">2. Delivery Timeline</h2>
        <p className="mb-2">Estimated delivery:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Metro Cities: 3–7 business days</li>
          <li>Other Locations: 5–10 business days</li>
        </ul>
        <p className="mb-6">
          Delivery timelines may vary due to logistics or external conditions.
        </p>

        <h2 className="text-xl font-semibold mb-2">3. Shipping Charges</h2>
        <p className="mb-6">
          Shipping charges, if applicable, will be displayed during checkout.
        </p>

        <h2 className="text-xl font-semibold mb-2">4. Delivery Partners</h2>
        <p className="mb-6">
          We use trusted third-party courier services for shipping. VisitingLink is
          not responsible for delays caused by courier providers or unforeseen
          circumstances.
        </p>

        <h2 className="text-xl font-semibold mb-2">5. Failed Delivery</h2>
        <p className="mb-8">
          Incorrect address or unavailable recipient may result in delivery failure.
          Re-shipping charges may apply.
        </p>

        {/* Data Deletion Policy */}
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">Data Deletion Policy</h1>
        <p className="text-sm text-slate-500 mb-6">
          (Very important for Meta + Google compliance)
        </p>
        <p className="text-sm text-slate-500 mb-6">Effective Date: [Insert Date]</p>

        <p className="mb-4">
          Users of <strong>VisitingLink</strong> have full control over their personal
          data.
        </p>

        <h2 className="text-xl font-semibold mb-2">1. Account Deletion Request</h2>
        <p className="mb-2">Users may request deletion of:</p>
        <ul className="list-disc pl-5 mb-2 space-y-1">
          <li>Account information</li>
          <li>Profile data</li>
          <li>Stored personal details</li>
        </ul>
        <p className="mb-2">by sending a request to:</p>
        <p className="mb-2">
          <a
            href="mailto:support@visitinglink.com"
            className="text-blue-600 underline"
          >
            support@visitinglink.com
          </a>
        </p>
        <p className="mb-6">
          <strong>Subject Line:</strong> Data Deletion Request
        </p>

        <h2 className="text-xl font-semibold mb-2">2. Deletion Timeline</h2>
        <p className="mb-6">
          Requests are processed within <strong>7 working days</strong>. All associated
          personal data will be permanently removed unless required by law.
        </p>

        <h2 className="text-xl font-semibold mb-2">3. Post Deletion</h2>
        <p className="mb-6">
          After deletion:
        </p>
        <ul className="list-disc pl-5 mb-10 space-y-1">
          <li>Profile links will stop functioning.</li>
          <li>QR/NFC cards linked to the account may become inactive.</li>
        </ul>
      </div>
      <Footer />
    </>
  );
}