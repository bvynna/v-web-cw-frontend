// app/store/commentStore.ts
import { create } from 'zustand';
import axios from 'axios';

interface Comment {
  id: number;
  content: string;
  likes: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
}

interface CommentState {
  comments: { [recipeId: number]: Comment[] };
  isLoading: boolean;
  fetchComments: (recipeId: number) => Promise<void>;
  addComment: (recipeId: number, content: string) => Promise<void>;
  deleteComment: (recipeId: number, commentId: number) => Promise<void>;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: {},
  isLoading: false,

  fetchComments: async (recipeId: number): Promise<void> => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`http://localhost:5000/api/recipes/${recipeId}/comments`);
      set(state => ({
        comments: {
          ...state.comments,
          [recipeId]: response.data,
        },
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      set({ isLoading: false });
    }
  },

  addComment: async (recipeId: number, content: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/recipes/${recipeId}/comments`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      set(state => ({
        comments: {
          ...state.comments,
          [recipeId]: [response.data, ...(state.comments[recipeId] || [])],
        },
      }));
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  },

  deleteComment: async (recipeId: number, commentId: number): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set(state => ({
        comments: {
          ...state.comments,
          [recipeId]: (state.comments[recipeId] || []).filter(comment => comment.id !== commentId),
        },
      }));
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      throw error;
    }
  },
}));
