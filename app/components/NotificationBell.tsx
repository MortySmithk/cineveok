// app/components/NotificationBell.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { rtdb } from './firebase';
import { ref, query, orderByChild, limitToLast, onValue, update, equalTo } from 'firebase/database';
import BellIcon from './icons/BellIcon';

// UID do Admin que recebe as notificações
const NOTIFICATION_ADMIN_UID = "RDdh6WnG2LZQS8gvZuAEdYnUMDr2";

interface Notification {
  id: string;
  type: string;
  text: string;
  authorName: string;
  mediaId: string;
  timestamp: number;
  read: boolean;
}

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

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminWithNotifications = user?.uid === NOTIFICATION_ADMIN_UID;

  // Efeito para buscar notificações e contagem de não lidas
  useEffect(() => {
    if (!isAdminWithNotifications) {
      setIsLoading(false);
      return;
    }

    const notificationsRef = ref(rtdb, `notifications/${NOTIFICATION_ADMIN_UID}`);
    
    // Query para as últimas 10 notificações (lidas ou não)
    const recentQuery = query(notificationsRef, limitToLast(10));
    const unsubscribeRecent = onValue(recentQuery, (snapshot) => {
      const data: Notification[] = [];
      snapshot.forEach((child) => {
        data.push({ id: child.key, ...child.val() } as Notification);
      });
      setNotifications(data.reverse()); // Mais recentes primeiro
      setIsLoading(false);
    });

    // Query APENAS para a contagem de não lidas
    const unreadQuery = query(notificationsRef, orderByChild('read'), equalTo(false));
    const unsubscribeUnread = onValue(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => {
      unsubscribeRecent();
      unsubscribeUnread();
    };
  }, [isAdminWithNotifications]);

  const handleToggleDropdown = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);

    // Se estiver abrindo E tiver notificações não lidas, marca todas como lidas
    if (newOpenState && unreadCount > 0) {
      const updates: { [key: string]: any } = {};
      notifications.forEach(noti => {
        if (!noti.read) {
          updates[`notifications/${NOTIFICATION_ADMIN_UID}/${noti.id}/read`] = true;
        }
      });
      update(ref(rtdb), updates).catch(err => console.error("Erro ao marcar notificações como lidas:", err));
    }
  };

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-btn focusable" 
        onClick={handleToggleDropdown}
        aria-label="Notificações"
      >
        <BellIcon />
        {isAdminWithNotifications && unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Só mostra o dropdown se for o admin certo E estiver aberto */}
      {isAdminWithNotifications && isOpen && (
        <div className="header-profile-dropdown notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notificações</strong>
          </div>
          {isLoading && (
            <div className="notification-item">Carregando...</div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="notification-item">Nenhuma notificação encontrada.</div>
          )}
          {!isLoading && notifications.map(noti => (
            <div key={noti.id} className={`notification-item ${!noti.read ? 'unread' : ''}`}>
              <p className="notification-text">
                <strong>{noti.authorName}</strong> comentou: "{noti.text}..."
              </p>
              <span className="notification-time">{formatTimeAgo(noti.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}