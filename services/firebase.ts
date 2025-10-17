import firebase from "firebase/compat/app";
import "firebase/compat/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAhV-zDVG6anJ-Ox8LA_UHeHTPN2R6fXs",
  authDomain: "studio-4201862341-a37db.firebaseapp.com",
  projectId: "studio-4201862341-a37db",
  storageBucket: "studio-4201862341-a37db.appspot.com",
  messagingSenderId: "1032963134049",
  appId: "1:1032963134049:web:a79f7dbc9c553752ce1020",
  databaseURL: "https://studio-4201862341-a37db-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const db = firebase.database();
