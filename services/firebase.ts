import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAhV-zDVG6anJ-Ox8LA_UHeHTPN2R6fXs",
  authDomain: "studio-4201862341-a37db.firebaseapp.com",
  projectId: "studio-4201862341-a37db",
  storageBucket: "studio-4201862341-a37db.appspot.com",
  messagingSenderId: "1032963134049",
  appId: "1:1032963134049:web:a79f7dbc9c553752ce1020"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
