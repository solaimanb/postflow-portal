import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Facebook Topics & Posting Portal",
  description:
    "Terms and conditions for using the Facebook Topics & Posting Portal",
};

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            By accessing and using the Facebook Topics & Posting Portal, you
            agree to be bound by these Terms of Service and all applicable laws
            and regulations. If you do not agree with any of these terms, you
            are prohibited from using this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Permission is granted to temporarily access the Portal for
              personal or business use, subject to the following conditions:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>
                You must maintain all Facebook platform policies and guidelines
              </li>
              <li>
                You may not use the service for any illegal or unauthorized
                purpose
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials
              </li>
              <li>
                You must comply with all applicable social media platform terms
                of service
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. Service Description
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The Portal provides:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Facebook topic analysis and trending content insights</li>
            <li>Content scheduling and posting capabilities</li>
            <li>Data analytics and reporting tools</li>
            <li>Multi-page management features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            4. User Responsibilities
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            As a user of the Portal, you agree to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the confidentiality of your account</li>
            <li>
              Use the service in compliance with Facebook&apos;s terms and
              policies
            </li>
            <li>Not engage in any automated scraping or data collection</li>
            <li>Respect intellectual property rights and content ownership</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            5. API Usage and Limitations
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            The service utilizes various APIs with the following conditions:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Facebook Graph API rate limits must be respected</li>
            <li>API access tokens must be kept secure</li>
            <li>Usage quotas and limitations apply to all accounts</li>
            <li>We reserve the right to modify API access as needed</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Content Guidelines</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Users are responsible for all content posted through the Portal.
            Content must not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-4">
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Contain malicious code or harmful content</li>
            <li>Violate Facebook&apos;s community standards</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            7. Service Modifications
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            We reserve the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-4">
            <li>Modify or discontinue any part of the service</li>
            <li>Update pricing and feature availability</li>
            <li>Change service providers or API integrations</li>
            <li>Implement new security measures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Disclaimer</h2>
          <p className="text-gray-700 dark:text-gray-300">
            The Portal is provided &quot;as is&quot; without warranties of any
            kind. We are not responsible for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mt-4">
            <li>Facebook API changes or limitations</li>
            <li>Content accuracy or reliability</li>
            <li>Third-party service interruptions</li>
            <li>Data loss or security breaches outside our control</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            9. Contact Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            For questions about these terms, please contact us at:
          </p>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p>Email: terms@portal.com</p>
            <p>Address: [Your Company Address]</p>
          </div>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Terms;
