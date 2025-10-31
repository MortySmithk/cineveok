// app/perfil/page.tsx
"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/components/AuthProvider';
import { auth, db } from '@/app/components/firebase';
import { updateProfile, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Chave da API do ImgBB fornecida
const IMG_BB_KEY = "497da48eaf4aaa87f1f0b659ed76a605";

// --- ÍCONE DE LÁPIS ADICIONADO ---
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    <path d="m15 5 4 4" />
  </svg>
);
// --- FIM DO ÍCONE ---

export default function PerfilPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ... (Estados permanecem os mesmos) ...
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');


  // ... (useEffect de carregamento permanece o mesmo) ...
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUsername(data.username || '');
            setBannerPreview(data.bannerURL || null);
          }
        })
        .catch((err) => {
          console.error("Erro ao buscar dados do Firestore:", err);
          setError("Não foi possível carregar seus dados personalizados.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      router.push('/login');
    }
  }, [user, router]);

  // ... (uploadToImgBB permanece o mesmo) ...
  const uploadToImgBB = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error.message || "Falha no upload da imagem.");
      }
    } catch (err: any) {
      console.error("Erro no upload para ImgBB:", err);
      setError(`Erro no upload: ${err.message}`);
      return null;
    }
  };

  // ... (handleFileChange permanece o mesmo) ...
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'photo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'photo') {
          setPhotoFile(file);
          setPhotoPreview(reader.result as string);
        } else {
          setBannerFile(file);
          setBannerPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ... (handleSave permanece o mesmo) ...
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError('');
    try {
      let newPhotoURL = user.photoURL || (photoPreview || null); // Correção: manter preview se não houver user.photoURL
      let newBannerURL = bannerPreview || null;
  
      if (photoFile) {
        const uploadedPhotoURL = await uploadToImgBB(photoFile);
        if (uploadedPhotoURL) newPhotoURL = uploadedPhotoURL;
      }
      if (bannerFile) {
        const uploadedBannerURL = await uploadToImgBB(bannerFile);
        if (uploadedBannerURL) newBannerURL = uploadedBannerURL;
      }
  
      await updateProfile(user, {
        displayName: displayName,
        photoURL: newPhotoURL,
      });
  
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        username: username,
        bannerURL: newBannerURL,
        email: user.email
      }, { merge: true });
  
      alert("Perfil atualizado com sucesso!");
  
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      setError(`Falha ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  // ... (isLoading e !user checks permanecem os mesmos) ...
  if (isLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className='spinner'></div>
      </div>
    );
  }
  if (!user) {
    return null;
  }

  // --- ESTRUTURA JSX ATUALIZADA ---
  return (
    <main style={{ paddingTop: '100px' }}>
      <div className="main-container">
        <h1 className="page-title">Minha Conta</h1>
        
        <div className="profile-page-container">
          <form className="profile-form" onSubmit={handleSave}>
            
            {/* --- CABEÇALHO DO PERFIL (APENAS O BANNER) --- */}
            <div className="profile-header-container">
              
              {/* --- UPLOAD DO BANNER --- */}
              <label htmlFor="banner-upload" className="profile-banner-uploader focusable">
                <div className="profile-upload-overlay">
                  <PencilIcon />
                  <span>Trocar banner</span>
                </div>
                {bannerPreview ? (
                  <Image src={bannerPreview} alt="Banner" layout="fill" objectFit="cover" />
                ) : (
                  <div className="profile-banner-placeholder">
                    <span>Clique para adicionar um banner (1500x500 recomendado)</span>
                  </div>
                )}
              </label>
              <input 
                id="banner-upload" 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'banner')} 
                style={{ display: 'none' }}
              />

              {/* A FOTO DE PERFIL FOI MOVIDA DAQUI... */}
            </div>

            {/* --- NOVO: GRID DE CONTEÚDO (FOTO + CAMPOS) --- */}
            <div className="profile-content-grid">

              {/* --- COLUNA DA FOTO --- */}
              <div className="profile-picture-column">
                <label htmlFor="photo-upload" className="profile-picture-uploader focusable">
                  <div className="profile-upload-overlay">
                    <PencilIcon />
                  </div>
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Foto de Perfil" layout="fill" objectFit="cover" />
                  ) : (
                    <div className="profile-picture-placeholder">
                      <span>{displayName ? displayName[0].toUpperCase() : 'U'}</span>
                    </div>
                  )}
                </label>
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'photo')} 
                  style={{ display: 'none' }}
                />
              </div>

              {/* --- COLUNA DOS CAMPOS DO FORMULÁRIO --- */}
              <div className="profile-form-container">
                <div className="profile-fields">
                  <div className="form-group">
                    <label htmlFor="displayName">Nome de Exibição</label>
                    <input 
                      id="displayName"
                      type="text" 
                      className="form-input focusable"
                      placeholder="Seu nome visível" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="username">Nome de Usuário</label>
                    <input 
                      id="username"
                      type="text" 
                      className="form-input focusable"
                      placeholder="@seunome (ex: para futuras interações)" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      id="email"
                      type="email" 
                      className="form-input"
                      value={user.email || ''} 
                      disabled 
                      readOnly
                    />
                  </div>

                  {error && <p className="error-message">{error}</p>}

                  <button 
                    type="submit" 
                    className='btn-primary btn-full focusable' 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </div> {/* --- Fim do profile-content-grid --- */}
            
          </form>
        </div>
      </div>
    </main>
  );
}