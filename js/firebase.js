import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6HZ3m92hmtDDGnQ5inhvZqMc2hD5WRiM",
  authDomain: "parking-slot-management-e0e1d.firebaseapp.com",
  projectId: "parking-slot-management-e0e1d",
  storageBucket: "parking-slot-management-e0e1d.firebasestorage.app",
  messagingSenderId: "197019519845",
  appId: "1:197019519845:web:6b35b1d377b16d33a32f8c",
  measurementId: "G-F6Q5EBL0XH"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };