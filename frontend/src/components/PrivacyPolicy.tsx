import { Button } from "./ui/button";

export function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-indigo-700">UzaziSafe Privacy Policy</h1>

        <p className="text-gray-700">
          UzaziSafe is committed to protecting the privacy, safety, and dignity of all users: expectant mothers, healthcare providers, and partnering facilities. This Privacy Policy
          explains how we collect, store, use, and safeguard your information in compliance with
          the Kenya Data Protection Act (KDPA).
        </p>

        {/* 1. Information We Collect */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">1. Information We Collect</h2>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Personal details such as name and email.</li>
            <li>Clinical and maternal health data recorded during assessments.</li>
            <li>Provider information, including hospital affiliation.</li>
            <li>System logs such as login attempts, usage activity, and device/browser info.</li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">2. How We Use Your Information</h2>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>To generate maternal health risk predictions using machine learning.</li>
            <li>To support clinical decision-making for healthcare providers.</li>
            <li>To maintain secure authentication and prevent unauthorized access.</li>
            <li>To improve the performance, reliability, and safety of the UzaziSafe platform.</li>
            <li>To enable communication between mothers and healthcare providers.</li>
          </ul>
        </section>

        {/* 3. Machine Learning Transparency */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">3. Machine Learning Transparency</h2>
          <p className="text-gray-700">
            UzaziSafe uses supervised machine learning models to assist with maternal risk
            predictions. These predictions are generated based on the clinical data you provide.
            They are <span className="font-semibold">decision-support tools</span> and do not replace
            professional medical judgment. Healthcare providers remain responsible for final
            clinical decisions.
          </p>
        </section>

        {/* 4. Data Storage & Security */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">4. Data Storage & Security</h2>
          <p className="text-gray-700">
            All user information is securely stored in a protected PostgreSQL database. We use:
          </p>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Encryption during data transmission.</li>
            <li>Token-based authentication and secure API communication.</li>
            <li>Role-based access control (patients vs providers).</li>
            <li>Regular security monitoring and restricted server access.</li>
          </ul>
        </section>

        {/* 5. Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">5. Data Retention</h2>
          <p className="text-gray-700">
            UzaziSafe retains your health and account information only for as long as it is needed
            to provide services, comply with legal requirements, or maintain accurate medical
            records. Users may request deletion of their account and associated data where allowed
            under applicable law.
          </p>
        </section>

        {/* 6. Data Sharing */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">6. Data Sharing</h2>
          <p className="text-gray-700">
            UzaziSafe does <span className="font-semibold">not</span> sell or share your personal or
            clinical information with third-party advertisers or external organizations. Information
            is only shared with authorized healthcare providers involved in your care.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">7. Your Rights</h2>
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Request access to the data we store about you.</li>
            <li>Request correction of inaccurate or incomplete information.</li>
            <li>Request data deletion in accordance with Kenya Data Protection Act rules.</li>
            <li>Withdraw consent by discontinuing use of the platform.</li>
          </ul>
        </section>

        {/* 8. Children's Privacy */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">8. Children’s Privacy</h2>
          <p className="text-gray-700">
            UzaziSafe is intended for use by adult patients and licensed healthcare providers.
            We do not knowingly collect personal data from individuals under 18 without the
            involvement of a parent or guardian.
          </p>
        </section>

        {/* 9. Policy Updates */}
        <section>
          <h2 className="text-xl font-semibold text-indigo-600">9. Updates to This Privacy Policy</h2>
          <p className="text-gray-700">
            UzaziSafe may update this policy periodically to reflect improvements or regulatory
            changes. Users will be notified of major updates through the app interface.
          </p>
        </section>

        {/* Back Button */}
        <div className="pt-6">
          <Button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-700">
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
