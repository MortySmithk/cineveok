"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';

export default function TVLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  useTVNavigation();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/tv');
    } catch (err) {
      setError('Email ou senha inválidos.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/tv');
    } catch (err) {
      setError('Falha ao entrar com o Google.');
    }
  };

  return (
    <div className="tv-login-container">
      <div className="tv-login-box">
        <h1>Entrar</h1>
        <p>Use sua conta para continuar.</p>
        
        {error && <p className="tv-login-error">{error}</p>}
        
        <form onSubmit={handleLogin} className="tv-login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tv-login-input focusable"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="tv-login-input focusable"
            required
          />
          <button type="submit" className="tv-login-button-submit focusable">
            Entrar
          </button>
        </form>

        <div className="tv-login-divider">ou</div>

        <button onClick={handleGoogleLogin} className="tv-login-google-button focusable">
          Entrar com Google
        </button>
      </div>
    </div>
  );
}