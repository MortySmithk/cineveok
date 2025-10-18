"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/components/firebase'; // CORREÇÃO AQUI

export default function RegisterPage() {
  const [username, setUsername] = useState('');
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
      await updateProfile(userCredential.user, { displayName: username });
      router.push('/');
    } catch (err: any) {
      setError('Falha ao criar a conta. O email já pode estar em uso.');
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
        <h1>Criar conta</h1>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleEmailRegister} className="auth-form">
          <input 
            type="text" 
            placeholder="Nome de utilizador" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
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
            placeholder="Senha" 
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