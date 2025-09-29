// app/firebase-features.ts
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseFeaturesConfig = {
  apiKey: "AIzaSyASzMqjKOxR_KRo2JvSsBz5-2Ft3tb8Pmw",
  authDomain: "likesdocineveo.firebaseapp.com",
  projectId: "likesdocineveo",
  storageBucket: "likesdocineveo.firebasestorage.app",
  messagingSenderId: "797677297647",
  appId: "1:797677297647:web:b0cd29119ed2593934201a"
};

// Inicializa o app secundário do Firebase de forma segura para evitar duplicação
const featuresApp: FirebaseApp = !getApps().some(app => app.name === 'features')
  ? initializeApp(firebaseFeaturesConfig, 'features')
  : getApp('features');

const dbFeatures = getFirestore(featuresApp);

export { dbFeatures };