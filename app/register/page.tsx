// app/register/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

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
      // Atualiza o perfil com o nome de utilizador
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
  
  const authFormContainer: React.CSSProperties = {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
  };
  
  const authForm: React.CSSProperties = {
      width: '100%', maxWidth: '400px', padding: '2.5rem',
      backgroundColor: 'var(--card-color)', border: '1px solid var(--border-color)', borderRadius: '12px',
  };

  return (
    <div style={authFormContainer}>
      <div style={authForm}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Criar conta</h1>
        
        {error && <p style={{ color: 'var(--accent-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleEmailRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Nome de utilizador" value={username} onChange={(e) => setUsername(e.target.value)} required 
            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#0d0d0d', color: 'white' }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required 
            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#0d0d0d', color: 'white' }} />
          <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required 
            style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#0d0d0d', color: 'white' }} />
          <button type="submit" className='stream-button active' style={{border: 'none', padding: '0.9rem'}}>Criar conta</button>
        </form>

        <p style={{ textAlign: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>ou</p>

        <button onClick={handleGoogleLogin} className='details-button' style={{ width: '100%', justifyContent: 'center' }}>
            Continuar com Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            Já tem uma conta?{' '}
            <Link href="/login" style={{ color: 'var(--accent-yellow)', textDecoration: 'underline' }}>
                Entre aqui
            </Link>
        </p>
      </div>
    </div>
  );
}