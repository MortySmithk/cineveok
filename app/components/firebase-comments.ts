// app/firebase-comments.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração do seu SEGUNDO projeto Firebase (cinedisq)
const commentsFirebaseConfig = {
  apiKey: "AIzaSyCFv6RsflB2i2IJv2v09YTwE6F2nzlCTxM",
  authDomain: "cinedisq.firebaseapp.com",
  databaseURL: "https://cinedisq-default-rtdb.firebaseio.com",
  projectId: "cinedisq",
  storageBucket: "cinedisq.firebasestorage.app",
  messagingSenderId: "289817340781",
  appId: "1:289817340781:web:395082c0c8b0eb600c8864"
};

// Inicializa o app de comentários com um nome único para não conflitar com o principal
const commentsApp: FirebaseApp = !getApps().some(app => app.name === 'cinedisq') 
  ? initializeApp(commentsFirebaseConfig, 'cinedisq') 
  : getApp('cinedisq');

// Exporta apenas a instância do Firestore deste segundo app
const commentsDb = getFirestore(commentsApp);

export { commentsDb };