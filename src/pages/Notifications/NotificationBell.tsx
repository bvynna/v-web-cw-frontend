import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../../app/store/notificationStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store/authStore';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const { user: currentUser } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // каждые 30 сек
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    setShowDropdown(false);

    if (notification.recipe) {
      const recipeAuthorId = notification.recipe.authorId;

      // Определяем куда переходить: на свой профиль или на чужой
      if (recipeAuthorId === currentUser?.id) {
        // Это мой рецепт → переходим на /profile
        navigate('/profile', {
          state: {
            scrollToRecipeId: notification.recipeId,
            commentId: notification.commentId || null,
            notificationType: notification.type,
          },
        });
      } else {
        // Это чужой рецепт → переходим на /user/:id
        navigate(`/user/${recipeAuthorId}`, {
          state: {
            scrollToRecipeId: notification.recipeId,
            commentId: notification.commentId || null,
            notificationType: notification.type,
          },
        });
      }
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case 'like':
        return `${notification.sender.name} лайкнул ваш рецепт "${notification.recipe?.title}"`;
      case 'comment':
        return `${notification.sender.name} оставил комментарий к рецепту "${notification.recipe?.title}"`;
      case 'reply':
        return `${notification.sender.name} ответил на ваш комментарий в рецепте "${notification.recipe?.title}"`;
      default:
        return 'Новое уведомление';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className='notification-bell-container'>
      <button className='notification-bell' onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && <span className='notification-badge'>{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className='notification-dropdown'>
          <div className='notification-header'>
            <h3>Уведомления</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className='mark-all-read'>
                Прочитать все
              </button>
            )}
          </div>
          <div className='notification-list'>
            {notifications.length === 0 ? (
              <p className='no-notifications'>Нет уведомлений</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className='notification-text'>{getNotificationText(notification)}</p>
                  <span className='notification-time'>{formatDate(notification.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
