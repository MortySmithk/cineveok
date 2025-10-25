// app/components/FirebaseComments.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { db } from './firebase'; // Importa seu 'db' do firebase
import { useAuth } from './AuthProvider'; // Importa seu hook de autenticação
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Interface para um comentário
interface Comment {
  id: string;
  text: string;
  mediaId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  createdAt: Timestamp;
}

// Props do componente
interface FirebaseCommentsProps {
  mediaId: string; // ID único do filme ou episódio (ex: currentStatsId)
}

// Função para formatar o tempo (ex: "há 5 minutos")
function formatTimeAgo(date: Date | null): string {
  if (!date) return '';

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `há ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'ano' : 'anos'}`;
  interval = seconds / 2592000;
  if (interval > 1) return `há ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'mês' : 'meses'}`;
  interval = seconds / 86400;
  if (interval > 1) return `há ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'dia' : 'dias'}`;
  interval = seconds / 3600;
  if (interval > 1) return `há ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'hora' : 'horas'}`;
  interval = seconds / 60;
  if (interval > 1) return `há ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'minuto' : 'minutos'}`;
  return 'agora mesmo';
}

export default function FirebaseComments({ mediaId }: FirebaseCommentsProps) {
  const { user } = useAuth(); // Pega o usuário logado
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Referência da coleção de comentários
  const commentsCollectionRef = collection(db, "comments");

  // Efeito para buscar comentários
  useEffect(() => {
    if (!mediaId) return;

    setIsLoading(true);
    // Cria a query para buscar comentários do mediaId, ordenados por data
    const q = query(
      commentsCollectionRef,
      where("mediaId", "==", mediaId),
      orderBy("createdAt", "desc")
    );

    // Ouve mudanças em tempo real
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData: Comment[] = [];
      querySnapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(commentsData);
      setCommentCount(commentsData.length);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar comentários: ", error);
      setIsLoading(false);
    });

    // Limpa o listener ao desmontar o componente
    return () => unsubscribe();
  }, [mediaId]);

  // Auto-ajuste da altura do textarea
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Função para enviar um novo comentário
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(commentsCollectionRef, {
        text: newComment,
        mediaId: mediaId,
        userId: user.uid,
        userName: user.displayName || 'Usuário Anônimo',
        userPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setNewComment(""); // Limpa o textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reseta altura
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário: ", error);
      alert("Não foi possível postar seu comentário. Tente novamente.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    setNewComment("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reseta altura
    }
  }

  return (
    <div className="comments-container">
      <h3 className="comments-header">{commentCount} Comentários</h3>

      {/* Caixa para adicionar novo comentário */}
      {user ? (
        <form className="add-comment-box" onSubmit={handleSubmitComment}>
          <div className="user-avatar-comment">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'Avatar'}
                width={40}
                height={40}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="avatar-placeholder">{user.displayName ? user.displayName[0].toUpperCase() : 'U'}</div>
            )}
          </div>
          <div className="comment-input-wrapper">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onInput={handleInput}
              placeholder="Adicione um comentário..."
              rows={1}
              className="comment-textarea"
              disabled={isPosting}
            />
            {newComment.length > 0 && (
              <div className="comment-actions">
                <button
                  type="button"
                  className="comment-btn-firebase cancel"
                  onClick={handleCancel}
                  disabled={isPosting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="comment-btn-firebase submit"
                  disabled={isPosting || !newComment.trim()}
                >
                  {isPosting ? 'Comentando...' : 'Comentar'}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <p className="comment-login-prompt">
          Você precisa <a href="/login">fazer login</a> para comentar.
        </p>
      )}

      {/* Lista de Comentários */}
      <div className="comment-list">
        {isLoading && <div className='spinner'></div>}
        
        {!isLoading && comments.length === 0 && (
          <p>Nenhum comentário ainda. Seja o primeiro!</p>
        )}

        {!isLoading && comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="user-avatar-comment">
              {comment.userPhotoURL ? (
                <Image
                  src={comment.userPhotoURL}
                  alt={comment.userName}
                  width={40}
                  height={40}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                 <div className="avatar-placeholder">{comment.userName ? comment.userName[0].toUpperCase() : 'U'}</div>
              )}
            </div>
            <div className="comment-content">
              <div className="comment-author-header">
                <span className="comment-author-name">{comment.userName}</span>
                <span className="comment-time">
                  {formatTimeAgo(comment.createdAt?.toDate())}
                </span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}