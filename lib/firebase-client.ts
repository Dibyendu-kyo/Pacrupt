import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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
let analytics: any = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  console.log("Firebase app initialized successfully (client)");
  
  db = getFirestore(app);
  console.log("Firestore database initialized successfully (client)");

  // Initialize analytics only in browser
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully (client)");
  }
} catch (error) {
  console.error("Firebase initialization error (client):", error);
  throw error;
}

export { app, db, analytics }; 