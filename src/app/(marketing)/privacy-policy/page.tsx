import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Facebook Topics & Posting Portal',
  description: 'Privacy policy and data handling practices for the Facebook Topics & Posting Portal',
}

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Welcome to the Facebook Topics & Posting Portal Privacy Policy. This policy describes how we collect, use, 
            and handle your information when you use our portal for Facebook topic analysis and content management.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">2.1 Account Information</h3>
            <p className="text-gray-700 dark:text-gray-300">
              When you use our portal, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Email addresses for authentication</li>
              <li>Password hashes for secure account access</li>
              <li>Session information for security purposes</li>
            </ul>

            <h3 className="text-xl font-medium">2.2 Facebook Data</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Through our integration with Facebook, we process:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
              <li>Facebook page access tokens</li>
              <li>Topic analysis data</li>
              <li>Content posting information</li>
              <li>Page engagement metrics</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We use the collected information to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Provide topic analysis and insights</li>
            <li>Enable content posting to Facebook pages</li>
            <li>Manage user authentication and security</li>
            <li>Improve our services and user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We implement several security measures to protect your data:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Secure password hashing using bcrypt</li>
            <li>Session-based authentication with expiration</li>
            <li>Rate limiting for login attempts</li>
            <li>Secure storage using Firebase infrastructure</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Our portal integrates with:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300">
            <li>Facebook Graph API for content management</li>
            <li>Apify for topic analysis</li>
            <li>Firebase for data storage and authentication</li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 mt-4">
            Each service has its own privacy policy and data handling practices.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We retain your data for as long as your account is active or as needed to provide services.
            You can request data deletion by contacting our support team.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For any privacy-related questions or concerns, please contact us at:
          </p>
          <div className="mt-2 text-gray-700 dark:text-gray-300">
            <p>Email: privacy@portal.com</p>
            <p>Address: [Your Company Address]</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Updates to This Policy</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update this privacy policy from time to time. We will notify users of any material changes
            through the portal or via email.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  )
}

export default PrivacyPolicy