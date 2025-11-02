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
    // Define a função de cleanup fora da promise
    let unsubscribe = () => {};

    // Define a persistência UMA VEZ.
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        // AGORA, configura o listener
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      })
      .catch((error) => {
        // Se a persistência falhar (ex: cookies bloqueados),
        // ainda tenta configurar o listener, mas a sessão não será "local"
        console.error("Erro ao definir a persistência, continuando...:", error);
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      });

    // Retorna a função de cleanup do useEffect
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Array vazio garante que isso rode SÓ UMA VEZ.
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