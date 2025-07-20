
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCT2jV9l2L1m8W2JD0uIFm_oO8osQLRLG0",
  authDomain: "solarphonelogin.firebaseapp.com",
  projectId: "solarphonelogin",
  storageBucket: "solarphonelogin.firebasestorage.app",
  messagingSenderId: "786062483251",
  appId: "1:786062483251:web:ba25b2cbdf864cf7a56846",
  measurementId: "G-82RBZMEZYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
