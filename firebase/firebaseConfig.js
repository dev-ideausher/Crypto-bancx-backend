// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBryp7QkWdMUTkhbAboUDCOWurwFu8u15k",
  authDomain: "blockhole-9ba38.firebaseapp.com",
  projectId: "blockhole-9ba38",
  storageBucket: "blockhole-9ba38.appspot.com",
  messagingSenderId: "634936675448",
  appId: "1:634936675448:web:d941504b244925d4df318d",
  measurementId: "G-BK7KZ7JNNW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);