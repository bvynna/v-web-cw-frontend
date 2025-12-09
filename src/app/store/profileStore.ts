import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  avatarUrl?: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string;
  category: string;
  instructions: string;
  imageUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
}

interface ProfileState {
  profile: UserProfile | null;
  myRecipes: Recipe[];
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  fetchMyRecipes: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  clearProfile: () => void;
  removeRecipe: (recipeId: number) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  myRecipes: [],
  isLoading: false,

  fetchProfile: async (): Promise<void> => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ profile: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      set({ isLoading: false });
    }
  },

  fetchMyRecipes: async (): Promise<void> => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/my-recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ myRecipes: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch user recipes:', error);
      set({ isLoading: false });
    }
  },

  updateProfile: async (name: string, email: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/users/profile`,
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      set({ profile: response.data });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  clearProfile: (): void => {
    set({ profile: null, myRecipes: [] });
  },

  removeRecipe: (recipeId: number) => {
    const { myRecipes } = get();
    set({
      myRecipes: myRecipes.filter(recipe => recipe.id !== recipeId),
    });
  },
}));
