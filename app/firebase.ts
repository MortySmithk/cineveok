// app/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNEGDpDLuWYrxTkoONy4oQujnatx6KIS8",
  authDomain: "cineveok.firebaseapp.com",
  databaseURL: "https://cineveok-default-rtdb.firebaseio.com",
  projectId: "cineveok",
  storageBucket: "cineveok.appspot.com",
  messagingSenderId: "805536124347",
  appId: "1:805536124347:web:b408c28cb0a4dc914d089e",
  measurementId: "G-H7WVDQQDVJ"
};

// Inicialização segura do Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };