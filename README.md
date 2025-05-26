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

## Facebook App Requirements

### Required Permissions

To use the posting features of this portal, your Facebook app must have these permissions:

- `pages_manage_posts` - Required for posting content to Facebook pages
- `pages_read_engagement` - Required for reading page information
- `pages_manage_metadata` - Required for managing page metadata
- `pages_manage_engagement` - Required for video uploads
- `publish_video` - Required specifically for video uploads

### Setting Up Facebook Permissions

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to App Settings > Advanced > Optional Permissions
4. Request the required permissions listed above
5. After approval, generate a new Page Access Token using Graph API Explorer
6. Add your Facebook page with the new token in the Page Setup tab

If you encounter permission errors when posting, the app will provide specific guidance on how to resolve them.

### Facebook Video Upload Requirements

When uploading videos to Facebook pages, the application uses Facebook's Resumable Upload API as required by the platform. For video uploads to work correctly:

1. **Environment Setup**: Ensure your `.env.local` file includes:

   ```
   NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id_here
   ```

2. **Video Specifications**:

   - **File Type**: .mp4 (recommended)
   - **Aspect Ratio**: Supported ratios between 16:9 and 9:16
   - **Resolution**: Minimum 540x960 pixels (1080x1920 recommended)
   - **Video Settings**: H.264 or H.265 compression, fixed frame rate
   - **Audio Settings**: 128kbps+ bitrate, stereo channels, AAC codec

3. **Permissions**: In addition to the permissions above, ensure your app has:

   - `publish_video` permission specifically granted

4. **Upload Process**: The app handles the 3-step process required by Facebook:

   - Initializes an upload session with your App ID
   - Uploads the video file to Facebook's servers via a server-side proxy to avoid CORS issues
   - Publishes the video with the file handle

5. **Server-Side Proxy**: The application uses a server-side API route to handle video uploads to avoid CORS issues that occur when uploading directly from the browser to Facebook's servers.

6. **File Size Limits**: The server-side proxy is configured to handle files up to 50MB. For larger videos, consider compressing them first.

7. **Troubleshooting**: If video uploads fail, check:
   - All required permissions are granted
   - Your page access token is valid and not expired
   - The video meets Facebook's specifications
   - Your App ID is correctly set in the environment variables

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

## Environment Variables Setup

The application requires several environment variables to be configured. Create a `.env.local` file in the root directory using the following template:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Facebook Configuration
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
NEXT_PUBLIC_ACCESS_TOKEN=your-facebook-access-token

# Apify Configuration
NEXT_PUBLIC_APIFY_API_KEY=your-apify-api-key
NEXT_PUBLIC_APIFY_ACTOR_ID=danek~facebook-search-ppr
```

To obtain these values:

1. **Firebase Configuration**:

   - Create a project in [Firebase Console](https://console.firebase.google.com)
   - Go to Project Settings > General
   - Create a web app if you haven't already
   - Copy the configuration values from the Firebase SDK snippet

2. **Facebook Configuration**:

   - Create an app in [Facebook Developers](https://developers.facebook.com)
   - Get your App ID from the app settings
   - Generate an access token with required permissions

3. **Apify Configuration**:
   - Sign up for an [Apify](https://apify.com) account
   - Get your API key from account settings
   - Use the default actor ID or choose an alternative one

For security:

- Never commit your `.env.local` file to version control
- Keep your credentials secure and private
- Rotate access tokens periodically
- Use different credentials for development and production
