# LeadFlow Pro - Membership-Based Lead Management & Skiptracing

## Project Overview

LeadFlow Pro is a membership-based web application built with Next.js and Firebase. It's designed to help real estate professionals manage homeowner leads by allowing them to upload CSV files. These files are then automatically processed to perform skip-tracing (obtaining cell phone numbers) and can be further analyzed using Google Cloud's Vertex AI for advanced lead insights.

Every user gets their own account, and all uploaded leads are securely saved and accessible only within their personalized dashboard.

## Features

- **User Authentication:** Secure sign-up and sign-in via Email/Password and Google Sign-in using Firebase Authentication.
- **Protected Dashboard:** A personalized, secure dashboard accessible only to authenticated users.
- **CSV Lead Upload:** Intuitive interface to upload CSV files with homeowner lead data.
- **Automated CSV Parsing:** Server-side parsing of uploaded CSVs (expecting "First Name", "Last Name", "Street Address", "City", "State, Postal Code" columns).
- **Firestore Lead Storage:** Secure storage of leads in Firebase Firestore, uniquely linked to the uploading user.
- **On-Demand Skiptracing:** A **Callable Cloud Function** allows users to manually trigger skip-tracing for individual leads or selected batches from the dashboard, controlling costs.
- **Automated Lead Analysis (Placeholder):** Google Cloud Function triggers on lead updates to potentially use Vertex AI for advanced lead scoring or insights.
- **Automated Zillow Property Data:** A Cloud Function triggers after skip-tracing (or AI analysis) to fetch Zestimate, latitude, and longitude for properties.
- **Lead Display:** Users can view their uploaded leads and their skip-traced phone numbers, Zestimate, and map links in a clear, tabular format.
- **Responsive UI:** Styled with Tailwind CSS for a modern, responsive design.

## Technologies Used

- **Frontend:**
  - [Next.js 14.x (App Router)](https://nextjs.org/)
  - [React 18](https://react.dev/)
  - [TypeScript 5](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database (Firebase / Google Cloud Platform):**
  - [Firebase Authentication](https://firebase.google.com/docs/auth)
  - [Cloud Firestore](https://firebase.google.com/docs/firestore)
  - [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
  - [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
  - [Google Cloud Storage](https://cloud.google.com/storage) (used by Cloud Functions for internal operations related to Firebase)
  - [Vertex AI](https://cloud.google.com/vertex-ai) (Placeholder integration for future development)
  - `csv-parse`: For efficiently parsing CSV files in Node.js environments.
  - `axios`: For making HTTP requests to external APIs from Cloud Functions.
- **External API:**
  - **BatchData API:** (Placeholder - you'll integrate your actual skip-tracing service here.)

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js:** v18.x or higher (LTS recommended).
- **npm:** v8.x or higher (comes with Node.js).
- **Firebase CLI:** `npm install -g firebase-tools`.

## Getting Started

This section outlines how to get the project running after cloning/pulling it.

### Initial Setup (First Clone)

Follow these steps if you are cloning the repository for the first time on a new machine.

1.  **Clone the Repository:**

    ```bash
    git clone [https://github.com/JFernandez0524/batch-multer-nextjs.git](https://github.com/JFernandez0524/batch-multer-nextjs.git)
    cd batch-multer-nextjs # Navigate into your project directory
    ```

2.  **Firebase Project Setup (One-time, if not done yet):**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and create or select your project (e.g., `leads-2b58f`).
    - **Enable Services:**
      - **Authentication:** Enable "Email/Password" and "Google" sign-in.
      - **Firestore Database:** Create your database (test mode for dev).
      - **Cloud Storage:** Get started with your default bucket.
      - **Cloud Functions:** Upgrade to the **Blaze plan**.
    - **Enable Google Cloud APIs:**
      - **Cloud Firestore API:** Visit `https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=YOUR_PROJECT_ID` (replace `YOUR_PROJECT_ID` with `leads-2b58f`). Click "ENABLE".
      - **(Optional)** **Vertex AI API:** Visit `https://console.cloud.google.com/apis/library/aiplatform.googleapis.com` (ensure project is selected). Click "ENABLE".
    - **Download Firebase Admin SDK Service Account Key:**
      - Firebase Console > Project settings > "Service accounts" tab.
      - Click "Generate new private key". Download the JSON file.
      - **Create `firebase-admin-key/` directory**: At your project root (`batch-multer-nextjs/`), create a new directory named `firebase-admin-key`.
      - **Move the downloaded JSON file into `firebase-admin-key/`.** Example: `mv ~/Downloads/YOUR_KEY_FILE.json firebase-admin-key/`
      - **Ensure `firebase-admin-key/` is in your `.gitignore` file** (it should be if you followed previous steps, but double-check). This directory holds your sensitive key and will not be committed to Git.
      - **Crucially, store the path and content of this key (e.g., in ClickUp)** for secure access on other machines.

### Standard Setup (For new clone or after pulling changes)

Follow these steps to set up the project on any machine, or to get updates after `git pull`.

1.  **Copy Sensitive Environment Files:**
    These files are NOT committed to Git for security reasons. You must copy them manually from your secure storage location (e.g., from your other machine, an encrypted backup, or ClickUp).

    - **`firebase-admin-key/` directory:** Copy this **entire directory** (containing your service account JSON file) to your project root (`batch-multer-nextjs/firebase-admin-key/`).
    - **`.env.local`**: Place this file in the root of your project directory (`batch-multer-nextjs/.env.local`).
    - **`functions/.env`**: Place this file inside your `functions/` directory (`batch-multer-nextjs/functions/.env`).

2.  **Install Dependencies:**

    - At the **project root** (`batch-multer-nextjs/`):
      ```bash
      npm install
      ```
    - Navigate into the **`functions/` directory**:
      ```bash
      cd functions
      npm install
      ```
    - Go back to the **project root**:
      ```bash
      cd ..
      ```

3.  **Build Cloud Functions:**
    Your functions need to be compiled from TypeScript to JavaScript.

    - At the **project root**:
      ```bash
      cd functions
      npm run build
      cd ..
      ```

4.  **Set Local Firebase Admin SDK Authentication:**
    For local development, your `firebase-admin` SDK (used by Next.js API routes) needs to authenticate. This environment variable must be set in _every new terminal session_ before running the app. The key is now referenced relative to your project root.

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/home/fernandez/repos/batch-multer-nextjs/firebase-admin-key/YOUR_KEY_FILE_NAME.json"
    ```

    _(Replace `YOUR_KEY_FILE_NAME.json` with the actual filename of your service account key. You can find this by running `ls firebase-admin-key/` from your project root)._

5.  **Deploy Cloud Functions (if changes were made or first time on this machine):**
    If you've made changes to your Cloud Functions code, or this is the first time deploying them from this machine, deploy them:

    ```bash
    firebase deploy --only functions
    ```

    _This command will also upload the `functions/.env` file with your environment variables._

6.  **Deploy Firestore Security Rules (if rules were changed):**
    If your `firestore.rules` file was modified:

    ```bash
    firebase deploy --only firestore:rules
    ```

7.  **Run the Application:**
    Finally, start your Next.js development server:

    ```bash
    npm run dev
    ```

    The application should now be running at `http://localhost:3000`.

## Usage

1.  **Access the Public Home Page:** Open your browser to `http://localhost:3000`.
2.  **Sign Up / Sign In:** Use the buttons to create an account or sign in.
3.  **Navigate to Dashboard:** Upon successful login, you'll be redirected to `/dashboard`.
4.  **Upload Leads:**
    - Go to the "Upload New Leads" page.
    - **CSV File Format:** Your CSV file _must_ contain the following headers (case-sensitive) and data, in this exact order:
      ```csv
      First Name,Last Name,Street Address,City,State,Postal Code
      John,Doe,123 Main St,Anytown,CA,90210
      Jane,Smith,456 Oak Ave,Someville,NY,10001
      ```
    - Select your CSV file and click "Upload CSV".
    - Monitor your terminal (where `npm run dev` is running) for API route logs.
    - Monitor your [Firebase Console > Functions > Logs](https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions/logs) for Cloud Function execution details.
5.  **View My Leads:**
    - Go to the "View My Leads" page from the dashboard to see your uploaded leads and their skip-traced phone numbers.

## Important Notes & Troubleshooting

- **Environment Variable Persistence:** Remember that `export` commands for `GOOGLE_APPLICATION_CREDENTIALS` are session-specific. You must run them in each new terminal window.
- **Firebase Project ID:** Ensure consistency across your `.env.local` file, `functions/.env` file, and your service account JSON file.
- **API Enablement:** If you encounter `PERMISSION_DENIED` or `NOT_FOUND` errors, double-check that all necessary Google Cloud APIs (like Cloud Firestore API, Eventarc API, Cloud Run API) are enabled for your project in the Google Cloud Console.
- **BatchData API:** Replace placeholders with your actual API endpoint and key.
- **Vertex AI:** The Vertex AI integration is a placeholder. Full setup with `@google-cloud/aiplatform` and a trained model will be required.
- **Security Rules:** For production, review and harden your Firestore Security Rules.

---
