import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// Remove analytics import from top level to prevent server-side issues
// import { getAnalytics } from "firebase/analytics";

// Debug environment variables
console.log("Firebase config check:");
console.log("API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "Missing");
console.log("Auth Domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "Present" : "Missing");
console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Present" : "Missing");
console.log("Storage Bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "Present" : "Missing");
console.log("Messaging Sender ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? "Present" : "Missing");
console.log("App ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "Present" : "Missing");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDigJUtWJblXNYlLTXMxBadRVo0sQubNQ8",
  authDomain: "new-maze-5bdb8.firebaseapp.com",
  projectId: "new-maze-5bdb8",
  storageBucket: "new-maze-5bdb8.appspot.com",
  messagingSenderId: "612263491039",
  appId: "1:612263491039:web:06fb8babae7be32a5d406a",
  measurementId: "G-FMMD8NFSZP"
};

let app;
let db: Firestore;
let analytics;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  console.log("Firebase app initialized successfully");
  
  db = getFirestore(app);
  console.log("Firestore database initialized successfully");

  // Only initialize analytics in the browser
  if (typeof window !== "undefined") {
    const { getAnalytics } = require("firebase/analytics");
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

export { app, db, analytics }; 