// app/login/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// --- IMPORTAÇÕES ATUALIZADAS ---
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  setPersistence,           // <-- ADICIONADO
  browserLocalPersistence   // <-- ADICIONADO
} from 'firebase/auth'; 
import { auth, db } from '@/app/components/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { useAuth } from '@/app/components/AuthProvider';

// Importação do CSS específico de Autenticação
import "./AuthPage.css";

// --- Helper (Sem alteração) ---
const generateUsername = (name: string, email: string): string => {
  const base = name 
    ? name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') 
    : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const finalBase = base || 'usuario';
  return `@${finalBase.substring(0, 15)}`;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // --- handleEmailLogin ATUALIZADO ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Define a persistência LOCAL antes do login
      await setPersistence(auth, browserLocalPersistence); 
      
      // 2. Faz o login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 3. (NOVO) Sincroniza os dados do Firestore (corrige "Usuário Anônimo")
      const loggedUser = userCredential.user;
      const userDocRef = doc(db, 'users', loggedUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Se o usuário logou mas não tem doc, cria um básico
        const newUsername = generateUsername(loggedUser.displayName || '', loggedUser.email || '');
        await setDoc(userDocRef, {
          uid: loggedUser.uid,
          displayName: loggedUser.displayName || 'Usuário',
          email: loggedUser.email,
          photoURL: loggedUser.photoURL || null,
          username: newUsername
        }, { merge: true });
      }
      // Fim da nova lógica
      
      router.push('/');
    } catch (err: any) {
      setError('Falha ao entrar. Verifique o seu email e senha.');
      console.error(err.message);
    }
  };
  
  // --- handleGoogleLogin ATUALIZADO ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // 1. Define a persistência LOCAL antes do login
      await setPersistence(auth, browserLocalPersistence);
      
      // 2. Faz o login com Google
      const userCredential = await signInWithPopup(auth, provider);
      
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      let finalUsername = '';
      if (docSnap.exists() && docSnap.data().username) {
        finalUsername = docSnap.data().username;
      } else {
        finalUsername = generateUsername(user.displayName || '', user.email || '');
      }

      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        username: finalUsername
      }, { merge: true }); 

      router.push('/');
    } catch (err: any) {
      setError('Falha ao entrar com o Google.');
      console.error(err.message);
    }
  };

  if (user) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }

  // --- JSX (Sem alteração) ---
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h1>Entrar na sua conta</h1>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleEmailLogin} className="auth-form">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="form-input focusable"
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="form-input focusable" 
          />
          <button type="submit" className='btn-primary btn-full focusable'>Entrar</button>
        </form>
        <p className="separator-text">ou</p>
        <button onClick={handleGoogleLogin} className='btn-secondary btn-full focusable'>
            Entrar com Google
        </button>
        <p className="link-text">
            Não tem uma conta?{' '}
            <Link href="/register" className="focusable">
                Crie uma conta
            </Link>
        </p>
      </div>
    </div>
  );
}