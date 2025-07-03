// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAgl8cOdZHmI51AkuqOVaSBcZENXzT1aUg",
  authDomain: "vijay-caterers.firebaseapp.com",
  databaseURL: "https://vijay-caterers-default-rtdb.firebaseio.com",
  projectId: "vijay-caterers",
  storageBucket: "vijay-caterers.firebasestorage.app",
  messagingSenderId: "151503284772",
  appId: "1:151503284772:web:ad1c8aac2ba87de0a6c6b1",
  measurementId: "G-SQZERF7VKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance
const database = getDatabase(app);

// Export both
export { app, database };
