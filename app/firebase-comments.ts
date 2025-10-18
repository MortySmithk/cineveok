// app/firebase-comments.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const commentsFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_COMMENTS_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_COMMENTS_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_COMMENTS_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_COMMENTS_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_COMMENTS_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_COMMENTS_APP_ID
};

const appName = 'cinedisq';
const commentsApp: FirebaseApp = !getApps().some(app => app.name === appName) 
  ? initializeApp(commentsFirebaseConfig, appName) 
  : getApp(appName);

const commentsDb = getFirestore(commentsApp);

export { commentsDb };