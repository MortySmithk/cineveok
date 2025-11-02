// app/components/AuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from './firebase'; // db importado
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Importações do Firestore
import { toast } from 'react-hot-toast';
import { WatchLaterProvider } from '../hooks/useWatchLater'; // <-- 1. IMPORTAR

// ... (interface AuthContextType permanece a mesma)
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Salva ou atualiza o usuário no Firestore
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Novo usuário
          await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
          toast.success(`Bem-vindo, ${user.displayName}!`);
        } else {
          // Usuário existente
          await setDoc(userRef, {
            lastLogin: serverTimestamp(),
            displayName: user.displayName, // Atualiza caso mude no Google
            photoURL: user.photoURL // Atualiza caso mude no Google
          }, { merge: true }); // 'merge: true' para não sobrescrever dados existentes
          toast.success(`Bem-vindo de volta, ${user.displayName}!`);
        }
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast.success("Você saiu da sua conta.");
    } catch (error) {
      console.error("Erro ao sair:", error);
      toast.error("Erro ao sair. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {/* 2. ENVOLVER OS FILHOS (CHILDREN) */}
      <WatchLaterProvider>
        {children}
      </WatchLaterProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};