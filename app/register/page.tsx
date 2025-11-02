// app/register/page.tsx
"use client";

import { useState, useEffect } from 'react'; // <-- Importa useEffect
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/app/components/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import { useAuth } from '@/app/components/AuthProvider'; // <-- Importa o useAuth

// --- Helper para gerar username (Sem alteração) ---
const generateUsername = (name: string, email: string): string => {
  const base = name 
    ? name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') 
    : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const finalBase = base || 'usuario';
  return `@${finalBase.substring(0, 15)}`;
}

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth(); // <-- Pega o usuário do contexto

  // --- NOVO: useEffect para redirecionar se já estiver logado ---
  useEffect(() => {
    if (user) {
      router.push('/'); // Manda para a Home
    }
  }, [user, router]);
  // --- FIM DA ATUALIZAÇÃO ---

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { 
        displayName: displayName, 
        photoURL: null 
      });
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const newUsername = generateUsername(displayName, email); 

      await setDoc(userDocRef, {
        uid: userCredential.user.uid,
        displayName: displayName, 
        username: newUsername, 
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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
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
  
  // --- ATUALIZADO: Mostra um loading se o 'user' ainda for incerto ---
  if (user) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }

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