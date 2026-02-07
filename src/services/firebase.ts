// Importation de Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration (Même si les clés sont fausses, le site va se construire !)
const firebaseConfig = {
  apiKey: "API_KEY_BIDON",
  authDomain: "projet.firebaseapp.com",
  projectId: "projet",
  storageBucket: "projet.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:00000000:web:00000000"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
