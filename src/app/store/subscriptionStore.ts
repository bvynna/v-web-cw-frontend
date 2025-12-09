import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface SubscriptionState {
  subscribersCount: { [userId: number]: number };
  isSubscribed: { [userId: number]: boolean };
  subscribe: (userId: number) => Promise<void>;
  unsubscribe: (userId: number) => Promise<void>;
  checkSubscription: (userId: number) => Promise<boolean>;
  fetchSubscribersCount: (userId: number) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscribersCount: {},
  isSubscribed: {},

  subscribe: async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/users/${userId}/subscribe`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        isSubscribed: { ...state.isSubscribed, [userId]: true },
        subscribersCount: {
          ...state.subscribersCount,
          [userId]: (state.subscribersCount[userId] || 0) + 1,
        },
      }));
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  },

  unsubscribe: async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${userId}/subscribe`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        isSubscribed: { ...state.isSubscribed, [userId]: false },
        subscribersCount: {
          ...state.subscribersCount,
          [userId]: Math.max(0, (state.subscribersCount[userId] || 0) - 1),
        },
      }));
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  },

  checkSubscription: async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${userId}/subscribe/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set(state => ({
        isSubscribed: { ...state.isSubscribed, [userId]: response.data.isSubscribed },
      }));
      return response.data.isSubscribed;
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  },

  fetchSubscribersCount: async (userId: number) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/subscribers/count`);
      set(state => ({
        subscribersCount: { ...state.subscribersCount, [userId]: response.data.count },
      }));
    } catch (error) {
      console.error('Failed to fetch subscribers count:', error);
    }
  },
}));
