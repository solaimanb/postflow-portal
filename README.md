# Facebook Topics & Posting Portal

A comprehensive portal for managing Facebook topics and posting, built with Next.js, Tailwind CSS, Shadcn UI, and Firebase.

## Project Overview

This portal enables users to:

- Fetch popular topics from Facebook based on keywords and date-time ranges
- Display topics in a table with CSV export functionality
- Write, post, and schedule content to multiple Facebook pages from a single interface
- Secure authentication with email/password and session management

## Technologies

- **Frontend**: Next.js, Tailwind CSS, Shadcn UI
- **Backend & Auth**: Firebase (Firestore), Session-based Authentication
- **Integrations**: FGA and Apify APIs

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Authentication System

The portal uses a secure session-based authentication system:

- **Admin Users**: Stored in Firestore with bcrypt-hashed passwords
- **Session Management**: Tokens stored in sessionStorage with 2-hour expiration
- **Security Features**: Rate limiting for login attempts, automatic session expiration
- **Default Admin**: Email: admin@portal.com (password provided separately)

To add new admin users, use the initialization script:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
node scripts/initAdmin.js
```

## Features

- **Topic Analytics**: Search and view trending Facebook topics by keyword and date
- **Content Management**: Create, schedule, and post content to Facebook pages
- **Secure Access**: Email/password login with session management
- **Data Export**: Download topic data in CSV format

## Deployment

The application is deployed on Firebase Hosting. Access details will be provided separately.

## Documentation

For detailed usage instructions, please refer to the admin documentation.
