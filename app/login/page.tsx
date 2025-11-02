"use client";

import { useState, useEffect } from 'react'; // <-- Importa useEffect
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/app/components/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { useAuth } from '@/app/components/AuthProvider'; // <-- Importa o useAuth

// --- Helper para gerar username (Sem alteração) ---
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
  const { user } = useAuth(); // <-- Pega o usuário do contexto

  // --- NOVO: useEffect para redirecionar se já estiver logado ---
  useEffect(() => {
    // Se o AuthProvider já carregou e o 'user' existe,
    // o usuário não deveria estar nesta página.
    if (user) {
      router.push('/'); // Manda para a Home
    }
  }, [user, router]);
  // --- FIM DA ATUALIZAÇÃO ---

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError('Falha ao entrar. Verifique o seu email e senha.');
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
  // Isso impede que a página de login pisque antes do redirecionamento
  if (user) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }

  // Se o usuário for 'null' (confirmado pelo AuthProvider), mostra a página
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