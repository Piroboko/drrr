// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQcWXbnYWmLP2KXE31Sc0aACKesVQOomw",
  authDomain: "drrr-8546a.firebaseapp.com",
  projectId: "drrr-8546a",
  storageBucket: "drrr-8546a.appspot.com",
  messagingSenderId: "333071419365",
  appId: "1:333071419365:web:213eee1b1b33f2aa62110c",
  measurementId: "G-76CV6TZZY3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();