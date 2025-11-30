import { create } from 'zustand';
import axios from 'axios';

interface Comment {
  id: number;
  content: string;
  likes: number;
  replyCount: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
  parentComment?: Comment;
  replies?: Comment[];
}

interface CommentState {
  comments: { [recipeId: number]: Comment[] };
  isLoading: boolean;
  fetchComments: (recipeId: number) => Promise<void>;
  addComment: (recipeId: number, content: string, parentCommentId?: number) => Promise<void>;
  deleteComment: (recipeId: number, commentId: number) => Promise<void>;
  fetchReplies: (commentId: number) => Promise<Comment[]>;
  addReply: (recipeId: number, parentCommentId: number, content: string) => Promise<void>;
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

  addComment: async (
    recipeId: number,
    content: string,
    parentCommentId?: number,
  ): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/recipes/${recipeId}/comments`,
        { content, parentCommentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      set(state => {
        const currentComments = state.comments[recipeId] || [];

        if (parentCommentId) {
          const updatedComments = currentComments.map(comment => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replyCount: comment.replyCount + 1,
                replies: [...(comment.replies || []), response.data],
              };
            }
            return comment;
          });

          return {
            comments: {
              ...state.comments,
              [recipeId]: updatedComments,
            },
          };
        } else {
          return {
            comments: {
              ...state.comments,
              [recipeId]: [response.data, ...currentComments],
            },
          };
        }
      });

      return response.data;
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

  fetchReplies: async (commentId: number): Promise<Comment[]> => {
    try {
      const response = await axios.get(`http://localhost:5000/api/comments/${commentId}/replies`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      return [];
    }
  },

  addReply: async (recipeId: number, parentCommentId: number, content: string): Promise<void> => {
    return get().addComment(recipeId, content, parentCommentId);
  },
}));
