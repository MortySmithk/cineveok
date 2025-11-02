// app/u/[userId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/components/firebase';

// Interface para os dados do perfil público
interface UserProfile {
  displayName: string;
  username: string;
  photoURL: string | null;
  bannerURL: string | null;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setError('ID de usuário inválido.');
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Buscamos os dados públicos do usuário do Firestore
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setError('Perfil não encontrado.');
        }
      } catch (err: any) {
        console.error("Erro ao buscar perfil:", err);
        setError('Não foi possível carregar o perfil.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }

  if (error) {
    return (
      <main style={{ paddingTop: '100px' }}>
        <div className="main-container text-center">
          <h1 className="page-title" style={{ justifyContent: 'center' }}>Erro</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  // Usamos os mesmos estilos da página de "Minha Conta" para consistência
  return (
    <main style={{ paddingTop: '100px' }}>
      <div className="main-container">
        <h1 className="page-title">{profile.displayName}</h1>
        
        <div className="profile-page-container">
          <div className="profile-form" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Banner */}
            <div className="profile-header-container">
              <div className="profile-banner-uploader" style={{ cursor: 'default' }}>
                {profile.bannerURL ? (
                  <Image src={profile.bannerURL} alt="Banner" layout="fill" objectFit="cover" />
                ) : (
                  <div className="profile-banner-placeholder" style={{ minHeight: '200px' }}>
                    {/* Sem banner */}
                  </div>
                )}
              </div>
            </div>

            {/* Grid de Conteúdo */}
            <div className="profile-content-grid">
              {/* Foto */}
              <div className="profile-picture-column">
                <div className="profile-picture-uploader" style={{ cursor: 'default', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  {profile.photoURL ? (
                    <Image src={profile.photoURL} alt="Foto de Perfil" layout="fill" objectFit="cover" />
                  ) : (
                    <div className="profile-picture-placeholder">
                      <span>{profile.displayName ? profile.displayName[0].toUpperCase() : 'U'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Campos (Apenas leitura) */}
              <div className="profile-form-container">
                <div className="profile-fields" style={{ padding: '2.5rem' }}>
                  <div className="form-group">
                    <label>Nome de Exibição</label>
                    <p className="form-input" style={{ opacity: 0.9 }}>{profile.displayName}</p>
                  </div>
                  <div className="form-group">
                    <label>Nome de Usuário</label>
                    <p className="form-input" style={{ opacity: 0.9 }}>{profile.username || '(Não definido)'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}