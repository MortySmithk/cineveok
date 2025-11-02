// app/components/FirebaseComments.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { rtdb, db } from './firebase'; 
import { useAuth } from './AuthProvider';
import {
  ref,
  push,
  query,
  orderByChild,
  onValue,
  serverTimestamp,
  off,
  remove,
  update,
  runTransaction,
  increment,
  child
} from 'firebase/database';
import { doc, onSnapshot } from 'firebase/firestore'; 

import LikeIcon from './icons/LikeIcon';
import DislikeIcon from './icons/DislikeIcon';

// --- (NOVO) UID do Admin que receberá as notificações ---
const NOTIFICATION_ADMIN_UID = "RDdh6WnG2LZQS8gvZuAEdYnUMDr2";

// --- Interfaces Atualizadas ---
interface UserProfile {
  displayName: string;
  photoURL: string | null;
}
interface Comment {
  id: string; text: string; mediaId: string; userId: string;
  createdAt: number; replyToId: string | null;
  likeCount?: number; dislikeCount?: number;
  replyCount?: number; // Contador de respostas
}
type LikeStatus = 'liked' | 'disliked' | null;
interface FirebaseCommentsProps {
  mediaId: string;
}
interface CommentItemProps {
  comment: Comment;
  mediaId: string;
  currentUserId: string | null;
  onReply: (comment: Comment) => void;
}

// --- Função formatTimeAgo (Sem alteração) ---
function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
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

// --- Hook useUserProfile (Sem alteração) ---
function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    if (!userId) {
      setProfile({ displayName: 'Usuário Anônimo', photoURL: null });
      return;
    }
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          displayName: data.displayName || 'Usuário',
          photoURL: data.photoURL || null
        });
      } else {
        setProfile({ displayName: 'Usuário Anônimo', photoURL: null });
      }
    }, (error) => {
      console.error("Erro ao ouvir perfil do usuário:", error);
      setProfile({ displayName: 'Usuário Anônimo', photoURL: null });
    });
    return () => unsubscribe();
  }, [userId]);
  return profile;
}

// ===================================================================
// === SUB-COMPONENTE: CommentItem (Sem alteração) ===
// ===================================================================
function CommentItem({ comment, mediaId, currentUserId, onReply }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.text);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [likeStatus, setLikeStatus] = useState<LikeStatus>(null);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const repliesQueryRef = useRef<any>(null);
  const unsubscribeRepliesRef = useRef<(() => void) | null>(null);
  
  const profile = useUserProfile(comment.userId);

  const commentRef = comment.replyToId
    ? ref(rtdb, `comment_replies/${comment.replyToId}/${comment.id}`)
    : ref(rtdb, `comments/${mediaId}/${comment.id}`);

  // --- useEffect de Likes (CORRIGIDO) ---
  useEffect(() => {
    // --- CORREÇÃO: Substituído .path por child() ---
    const countersRef = child(commentRef, 'counters');
    
    const unsubCounters = onValue(countersRef, (snapshot) => {
      const data = snapshot.val();
      setLikeCount(data?.likes || 0);
      setDislikeCount(data?.dislikes || 0);
    });
    if (currentUserId) {
      const userLikeRef = ref(rtdb, `comment_likes/${comment.id}/${currentUserId}`);
      const unsubUserLike = onValue(userLikeRef, (snapshot) => {
        setLikeStatus(snapshot.val() || null);
      });
      return () => { unsubCounters(); unsubUserLike(); };
    }
    return () => unsubCounters();
  }, [comment.id, currentUserId, commentRef]); // <- commentRef adicionado como dependência

  // --- useEffect de Limpeza (Atualizado) ---
  useEffect(() => {
    return () => {
      if (unsubscribeRepliesRef.current) {
        unsubscribeRepliesRef.current();
      }
    };
  }, []);

  // --- Função para carregar respostas (Atualizado para realtime) ---
  const loadReplies = () => {
    setIsLoadingReplies(true);
    repliesQueryRef.current = query(ref(rtdb, `comment_replies/${comment.id}`), orderByChild("createdAt"));
    
    // Agora ouve em tempo real
    unsubscribeRepliesRef.current = onValue(repliesQueryRef.current, (snapshot) => {
      const repliesData: Comment[] = [];
      snapshot.forEach((child) => {
        repliesData.push({ id: child.key, ...child.val() } as Comment);
      });
      setReplies(repliesData);
      setIsLoadingReplies(false);
    });
  };

  // --- Função para alternar respostas (Atualizado) ---
  const toggleReplies = () => {
    const newShowState = !showReplies;
    setShowReplies(newShowState);
    if (newShowState) {
      loadReplies(); // Inicia o listener
    } else {
      if (unsubscribeRepliesRef.current) {
        unsubscribeRepliesRef.current(); // Para o listener
        unsubscribeRepliesRef.current = null;
      }
    }
  };

  // --- Função de Apagar (Atualizado) ---
  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja apagar este comentário?")) {
      try {
        await remove(commentRef);
        
        if (comment.replyToId) {
          // Se é uma RESPOSTA, decrementa o contador do PAI
          const rootCommentRef = ref(rtdb, `comments/${mediaId}/${comment.replyToId}`);
          await runTransaction(rootCommentRef, (c) => {
            if (c) { c.replyCount = (c.replyCount || 1) - 1; }
            return c;
          });
        } else {
          // Se é um PAI, apaga todas as suas respostas
          await remove(ref(rtdb, `comment_replies/${comment.id}`));
          // TODO: Apagar likes (Cloud Function seria o ideal)
        }
      } catch (error) {
        console.error("Erro ao apagar:", error);
        alert("Não foi possível apagar o comentário.");
      }
    }
  };

  // --- handleEdit (Sem alteração) ---
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editContent.trim()) return;
    try { await update(commentRef, { text: editContent }); setIsEditing(false); } 
    catch (error) { console.error("Erro ao editar:", error); alert("Não foi possível salvar a edição."); }
  };

  // --- handleLikeDislike (CORRIGIDO) ---
  const handleLikeDislike = async (newStatus: 'liked' | 'disliked') => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    const userLikeRef = ref(rtdb, `comment_likes/${comment.id}/${currentUserId}`);
    // --- CORREÇÃO: Substituído .path por child() ---
    const countersRef = child(commentRef, 'counters');
    
    const previousStatus = likeStatus;
    let finalNewStatus: LikeStatus = newStatus;
    try {
      await runTransaction(countersRef, (counters) => {
        if (!counters) counters = { likes: 0, dislikes: 0 };
        if (newStatus === 'liked') {
          if (previousStatus === 'liked') { counters.likes = increment(-1); finalNewStatus = null; } 
          else { counters.likes = increment(1); if (previousStatus === 'disliked') counters.dislikes = increment(-1); }
        } else if (newStatus === 'disliked') {
          if (previousStatus === 'disliked') { counters.dislikes = increment(-1); finalNewStatus = null; } 
          else { counters.dislikes = increment(1); if (previousStatus === 'liked') counters.likes = increment(-1); }
        }
        return counters;
      });
      await update(ref(rtdb), { [`comment_likes/${comment.id}/${currentUserId}`]: finalNewStatus });
    } catch (error) { console.error("Erro na transação de like:", error); } 
    finally { setIsLiking(false); }
  };

  const displayName = profile ? profile.displayName : 'Carregando...';
  const photoURL = profile ? profile.photoURL : null;
  const placeholder = profile ? (profile.displayName[0] || 'U').toUpperCase() : 'U';
  
  const replyCount = comment.replyCount || 0; // Pega o contador de respostas

  // --- JSX (Layout Corrigido) ---
  return (
    <div className="comment-item-wrapper">
      <div className="comment-item">
        <Link href={`/u/${comment.userId}`} className="comment-author-avatar-link focusable" aria-label={`Ver perfil de ${displayName}`}>
          <div className="user-avatar-comment">
            {photoURL ? (
              <Image src={photoURL} alt={displayName} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar-placeholder">{placeholder}</div>
            )}
          </div>
        </Link>
        <div className="comment-content">
          <div className="comment-author-header">
            <Link href={`/u/${comment.userId}`} className="comment-author-name-link focusable">
              <span className="comment-author-name">{displayName}</span>
            </Link>
            <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          {!isEditing ? (
            <p className="comment-text">{comment.text}</p>
          ) : (
            <form className="comment-edit-form" onSubmit={handleEdit}>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="comment-textarea" autoFocus />
              <div className="comment-actions">
                <button type="button" className="comment-btn-firebase cancel" onClick={() => setIsEditing(false)}>Cancelar</button>
                <button type="submit" className="comment-btn-firebase submit">Salvar</button>
              </div>
            </form>
          )}
          {!isEditing && (
            <div className="comment-item-actions">
              <button className="comment-action-btn focusable" onClick={() => handleLikeDislike('liked')} disabled={isLiking || !currentUserId} aria-label="Gostei">
                <LikeIcon isActive={likeStatus === 'liked'} width={18} height={18} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button className="comment-action-btn focusable" onClick={() => handleLikeDislike('disliked')} disabled={isLiking || !currentUserId} aria-label="Não gostei">
                <DislikeIcon isActive={likeStatus === 'disliked'} width={18} height={18} />
                {dislikeCount > 0 && <span>{dislikeCount}</span>}
              </button>
              <button className="comment-action-btn focusable" onClick={() => onReply(comment)} disabled={!currentUserId}>
                Responder
              </button>
              {currentUserId === comment.userId && (
                <>
                  <button className="comment-action-btn focusable" onClick={() => setIsEditing(true)}>Editar</button>
                  <button className="comment-action-btn focusable" onClick={handleDelete}>Apagar</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- ATUALIZADO: Botão "Ver Respostas" --- */}
      {!comment.replyToId && replyCount > 0 && (
        <button
          className="comment-toggle-replies focusable"
          onClick={toggleReplies}
        >
          {showReplies
            ? "Ocultar respostas"
            : `Ver ${replyCount} ${replyCount === 1 ? 'resposta' : 'respostas'}`
          }
        </button>
      )}

      {/* Respostas Aninhadas */}
      {showReplies && (
        <div className="comment-replies">
          {isLoadingReplies && <div className='spinner'></div>}
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              mediaId={mediaId} 
              currentUserId={currentUserId}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================================================
// === COMPONENTE PRINCIPAL: FirebaseComments (Atualizado) ===
// ===================================================================
export default function FirebaseComments({ mediaId }: FirebaseCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const replyToProfile = useUserProfile(replyTo?.userId || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsMediaRef = ref(rtdb, `comments/${mediaId}`);

  // Efeito para buscar comentários PRINCIPAIS (Sem alteração)
  useEffect(() => {
    if (!mediaId) return;
    setIsLoading(true);
    const q = query(commentsMediaRef, orderByChild("createdAt"));
    const unsubscribe = onValue(q, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((childSnapshot) => {
        commentsData.push({ id: childSnapshot.key, ...childSnapshot.val() } as Comment);
      });
      setComments(commentsData.reverse());
      setCommentCount(commentsData.length);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar comentários do RTDB: ", error);
      setIsLoading(false);
    });
    return () => off(q, 'value', unsubscribe);
  }, [mediaId]);
  
  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // --- (NOVO) Função para enviar notificação ---
  const sendNotificationToAdmin = (commentText: string) => {
    // Não envia notificação se o próprio admin estiver comentando
    if (user?.uid === NOTIFICATION_ADMIN_UID) {
      return;
    }

    const notificationData = {
      type: 'comment',
      text: commentText.substring(0, 100), // Limita o texto
      authorName: user?.displayName || 'Usuário',
      mediaId: mediaId,
      timestamp: serverTimestamp(),
      read: false
    };

    const notificationsRef = ref(rtdb, `notifications/${NOTIFICATION_ADMIN_UID}`);
    push(notificationsRef, notificationData).catch(error => {
      console.error("Erro ao enviar notificação:", error);
    });
  };
  
  // --- Função de Envio (ATUALIZADO para incluir notificação) ---
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentText = newComment.trim();
    if (!commentText || !user || isPosting) return;
    setIsPosting(true);

    try {
      let newCommentRef; // (NOVO) Referência para pegar o ID
      if (replyTo) {
        // --- Lógica de Resposta ATUALIZADA ---
        const rootCommentId = replyTo.replyToId || replyTo.id;
        const commentData = {
          text: commentText, mediaId: mediaId, userId: user.uid,
          createdAt: serverTimestamp(), replyToId: rootCommentId,
        };
        newCommentRef = await push(ref(rtdb, `comment_replies/${rootCommentId}`), commentData);
        
        // Incrementa o contador de respostas do PAI
        const rootCommentRef = ref(rtdb, `comments/${mediaId}/${rootCommentId}`);
        await runTransaction(rootCommentRef, (c) => {
          if (c) {
            c.replyCount = (c.replyCount || 0) + 1;
          }
          return c;
        });

      } else {
        // --- Lógica de Comentário PAI (Atualizado) ---
        const commentData = {
          text: commentText, mediaId: mediaId, userId: user.uid,
          createdAt: serverTimestamp(), replyToId: null,
          replyCount: 0 // Inicia o contador de respostas
        };
        newCommentRef = await push(commentsMediaRef, commentData);
      }
      
      // --- (NOVO) Envia notificação ---
      sendNotificationToAdmin(commentText);
      // --- Fim da notificação ---

      setNewComment(""); setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (error) {
      console.error("Erro ao adicionar comentário no RTDB: ", error);
      alert("Não foi possível postar seu comentário. Tente novamente.");
    } finally { setIsPosting(false); }
  };

  const handleCancelReply = () => {
    setReplyTo(null); setNewComment("");
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }
  const handleStartReply = (comment: Comment) => {
    setReplyTo(comment); textareaRef.current?.focus();
  }

  return (
    <div className="comments-container">
      <h3 className="comments-header">{commentCount} Comentários</h3>

      {user ? (
        <form className="add-comment-box" onSubmit={handleSubmitComment}>
          <div className="user-avatar-comment">
            {user.photoURL ? (
              <Image src={user.photoURL} alt={user.displayName || 'Avatar'} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar-placeholder">{user.displayName ? user.displayName[0].toUpperCase() : 'U'}</div>
            )}
          </div>
          <div className="comment-input-wrapper">
            
            {replyTo && replyToProfile && (
              <div className="comment-replying-to">
                Respondendo a 
                <span className="reply-to-name">@{replyToProfile.displayName}</span>
                <button type="button" onClick={handleCancelReply}>Cancelar</button>
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onInput={handleInput}
              placeholder={replyTo ? "Adicione uma resposta..." : "Adicione um comentário..."}
              rows={1}
              className="comment-textarea"
              disabled={isPosting}
            />
            {(newComment.length > 0 || replyTo) && (
              <div className="comment-actions">
                <button type="button" className="comment-btn-firebase cancel" onClick={handleCancelReply} disabled={isPosting}>
                  Cancelar
                </button>
                <button type="submit" className="comment-btn-firebase submit" disabled={isPosting || !newComment.trim()}>
                  {isPosting ? 'Enviando...' : (replyTo ? 'Responder' : 'Comentar')}
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
        {!isLoading && comments.length === 0 && (<p>Nenhum comentário ainda. Seja o primeiro!</p>)}
        {!isLoading && comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            mediaId={mediaId}
            currentUserId={user?.uid || null}
            onReply={handleStartReply}
          />
        ))}
      </div>
    </div>
  );
}