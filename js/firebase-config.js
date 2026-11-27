
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA_HFepP5O72j-ewmr0R0dP9aX20zoRy2Q",
  authDomain: "longitud-de-plank.firebaseapp.com",
  databaseURL: "https://longitud-de-plank-default-rtdb.firebaseio.com",
  projectId: "longitud-de-plank",
  storageBucket: "longitud-de-plank.firebasestorage.app",
  messagingSenderId: "52903258234",
  appId: "1:52903258234:web:f12dc4bea4cc938ef1b3c3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);