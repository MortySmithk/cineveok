// app/components/AuthProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
// --- IMPORTAÇÕES ATUALIZADAS ---
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/app/components/firebase';
import Image from 'next/image';

const AuthContext = createContext<{ user: User | null }>({ user: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- useEffect ATUALIZADO ---
  useEffect(() => {
    // 1. Define a persistência para "local" (salvar no navegador)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // 2. DEPOIS de definir a persistência, começa a ouvir o estado do usuário
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        // Se houver um erro (ex: cookies desativados)
        console.error("Erro ao definir a persistência da autenticação:", error);
        setLoading(false);
      });
      
    // A função de limpeza será o 'unsubscribe' retornado pela promessa
    // (O onAuthStateChanged já lida com isso)
  }, []);
  // --- FIM DA ATUALIZAÇÃO ---


  if (loading) {
    return (
      <div className="loading-container">
        <Image 
          src="https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png" 
          alt="Carregando..."
          width={120}
          height={120}
          className="loading-logo"
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);