import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBZTpJJdRDD6c8m0AvovVAsWv2pn2vFsTQ",
    authDomain: "yala360.firebaseapp.com",
    projectId: "yala360",
    storageBucket: "yala360.firebasestorage.app",
    messagingSenderId: "865795843679",
    appId: "1:865795843679:web:0c0802012144e19c0f5dea",
    databaseURL: "https://yala360-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);