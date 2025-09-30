"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

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
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: any) {
      setError('Falha ao entrar com o Google.');
      console.error(err.message);
    }
  };

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