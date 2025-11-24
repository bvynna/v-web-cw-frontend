import { create } from 'zustand';
import axios from 'axios';

interface Recipe {
  instructions: string;
  ingredients: string;
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
}

interface FavoriteState {
  favorites: Recipe[];
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  addToFavorites: (recipeId: number) => Promise<void>;
  removeFromFavorites: (recipeId: number) => Promise<void>;
  checkFavoriteStatus: (recipeId: number) => Promise<boolean>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  isLoading: false,

  fetchFavorites: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ favorites: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      set({ isLoading: false });
    }
  },

  addToFavorites: async (recipeId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/favorites/${recipeId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Обновляем лайки в глобальном состоянии если нужно
      console.log('Added to favorites:', response.data);
    } catch (error: any) {
      console.error('Failed to add to favorites:', error);
      throw error;
    }
  },

  removeFromFavorites: async (recipeId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/favorites/${recipeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Удаляем из локального состояния
      const { favorites } = get();
      set({
        favorites: favorites.filter(recipe => recipe.id !== recipeId),
      });

      console.log('Removed from favorites:', response.data);
    } catch (error: any) {
      console.error('Failed to remove from favorites:', error);
      throw error;
    }
  },

  checkFavoriteStatus: async (recipeId: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/favorites/${recipeId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.isFavorite;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  },
}));
