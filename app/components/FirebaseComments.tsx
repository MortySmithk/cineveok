// app/components/FirebaseComments.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/app/components/firebase';
import { useAuth } from '@/app/components/AuthProvider';

// Definindo a interface do usuário que receberemos como prop
interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  text: string;
  createdAt: Timestamp;
}

interface FirebaseCommentsProps {
  mediaId: string;
  currentUser: User | null; // Recebe o usuário logado do app principal
}

export default function FirebaseComments({ mediaId, currentUser }: FirebaseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ✅ NOVO: Função para ajustar a altura do textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reseta a altura
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Ajusta para a altura do conteúdo
    }
  };

  useEffect(() => {
    // Ajusta a altura sempre que o texto do comentário mudar
    adjustTextareaHeight();
  }, [newComment]);


  useEffect(() => {
    if (!mediaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const commentsCol = collection(db, 'comments');
    const q = query(
      commentsCol,
      where('mediaId', '==', mediaId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(fetchedComments);
      setIsLoading(false);
      setError(null); // Limpa o erro se os comentários carregarem com sucesso
    }, (err) => {
      console.error("Erro ao buscar comentários: ", err);
      setError("Não foi possível carregar os comentários. Verifique as permissões.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [mediaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || newComment.trim() === '') {
      return;
    }

    try {
      await addDoc(collection(db, 'comments'), {
        mediaId: mediaId,
        userId: currentUser.uid, // O nome do campo deve ser 'userId' para bater com a regra
        userName: currentUser.displayName || 'Anônimo',
        userPhotoURL: currentUser.photoURL || 'https://i.ibb.co/27ZbyVf/placeholder-person.png',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error("Erro ao enviar comentário: ", err);
      alert("Ocorreu um erro ao enviar seu comentário. Você está logado?");
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Agora mesmo';
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comments-section">
      <h3 className="comments-title">{comments.length} Comentário{comments.length !== 1 && 's'}</h3>
      
      {currentUser ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <Image
            src={currentUser.photoURL || 'https://i.ibb.co/27ZbyVf/placeholder-person.png'}
            alt="Seu avatar"
            width={40}
            height={40}
            className="comment-avatar"
          />
          <textarea
            ref={textareaRef} // ✅ NOVO: Adiciona a referência
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="comment-input"
            rows={1}
          />
          <button type="submit" className="comment-submit-btn" disabled={!newComment.trim()}>
            Comentar
          </button>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <a href="/login">Faça login</a> para comentar.
        </div>
      )}

      <div className="comments-list">
        {isLoading && <p>Carregando comentários...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && !error && comments.length === 0 && <p className="no-comments">Seja o primeiro a comentar!</p>}

        {comments.map(comment => (
          <div key={comment.id} className="comment-item">
            <Image
              src={comment.userPhotoURL}
              alt={comment.userName}
              width={40}
              height={40}
              className="comment-avatar"
            />
            <div className="comment-content">
              <div className="comment-header">
                <span className="comment-author">{comment.userName}</span>
                <span className="comment-date">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}