// app/register/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/app/components/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 

// --- NOVO: Helper para gerar username ---
const generateUsername = (name: string, email: string): string => {
  // Base é o nome de exibição (sem espaços/caracteres especiais) ou a parte local do email
  const base = name 
    ? name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') 
    : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Garante que não está vazio e limita o tamanho
  const finalBase = base || 'usuario';
  return `@${finalBase.substring(0, 15)}`;
}

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState(''); // Nome de Exibição
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 1. Atualiza o perfil do Auth (Nome de Exibição)
      await updateProfile(userCredential.user, { 
        displayName: displayName,
        photoURL: null // Começa sem foto
      });
      
      // 2. CRIA O PERFIL PÚBLICO NO FIRESTORE (COM USERNAME)
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const newUsername = generateUsername(displayName, email); // Gera username

      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        displayName: displayName, 
        username: newUsername, // Salva o @username
        email: email,
        photoURL: null,
        bannerURL: null
      });

      router.push('/');
    } catch (err: any) {
      setError('Falha ao criar a conta. O email já pode estar em uso.');
      console.error(err.message);
    }
  };

  // --- ATUALIZADO: handleGoogleLogin ---
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef); // Verifica se já existe
      
      let finalUsername = '';
      if (docSnap.exists() && docSnap.data().username) {
        finalUsername = docSnap.data().username; // Mantém o username existente
      } else {
        finalUsername = generateUsername(user.displayName || '', user.email || ''); // Gera um novo
      }

      // CRIA OU ATUALIZA O PERFIL PÚBLICO NO FIRESTORE
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        username: finalUsername // Salva o username
      }, { merge: true }); // Merge para não apagar dados existentes

      router.push('/');
    } catch (err: any) {
      setError('Falha ao entrar com o Google.');
      console.error(err.message);
    }
  };
  
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h1>Criar conta</h1>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleEmailRegister} className="auth-form">
          <input 
            type="text" 
            placeholder="Nome de Exibição (ex: Marreco TV)" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            required 
            className="form-input focusable"
          />
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
            placeholder="Senha (mínimo 6 caracteres)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="form-input focusable"
          />
          <button type="submit" className='btn-primary btn-full focusable'>Criar conta</button>
        </form>

        <p className="separator-text">ou</p>

        <button onClick={handleGoogleLogin} className='btn-secondary btn-full focusable'>
            Continuar com Google
        </button>

        <p className="link-text">
            Já tem uma conta?{' '}
            <Link href="/login" className="focusable">
                Entre aqui
            </Link>
        </p>
      </div>
    </div>
  );
}