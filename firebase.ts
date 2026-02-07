import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase (V27 Production)
const firebaseConfig = {
  apiKey: "AIzaSyCcFfAMoPDlBU2gNWyH-F4_XOSDdFTutIo",
  authDomain: "zuabillet-v27-cff93.firebaseapp.com",
  projectId: "zuabillet-v27-cff93",
  storageBucket: "zuabillet-v27-cff93.firebasestorage.app",
  messagingSenderId: "320354633560",
  appId: "1:320354633560:web:b775d88322f16685a7c72d"
};

// Initialisation de l'App
const app = initializeApp(firebaseConfig);

// Export des services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;