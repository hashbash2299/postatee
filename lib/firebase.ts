import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjcjQgQqw6FxGYE88OD7fDSv4pD-3yn9Y",
  authDomain: "postatee.firebaseapp.com",
  projectId: "postatee",
  storageBucket: "postatee.firebasestorage.app",
  messagingSenderId: "593425332320",
  appId: "1:593425332320:web:03659be2c6440119212b05"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);