import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'reply' | 'subscription';
  sender: {
    id: number;
    name: string;
  };
  recipe?: {
    id: number;
    title: string;
    authorId: number;
  };
  recipeId?: number;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ notifications: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/${notificationId}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/notifications/mark-all-read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  clearAllNotifications: async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/notifications/clear`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  },
}));
