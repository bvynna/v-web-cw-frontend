import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../app/store/authStore';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import { useCommentStore } from '../../app/store/commentStore';
import './UserProfile.css';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  likes: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
  ingredients: string;
  instructions: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const {
    comments,
    isLoading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
    addReply,
  } = useCommentStore();
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (userRecipes.length > 0) {
      checkFavorites();
    }
  }, [userRecipes]);

  const fetchUserProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const [profileResponse, recipesResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/users/${userId}`),
        axios.get(`http://localhost:5000/api/users/${userId}/recipes`),
      ]);
      setUserProfile(profileResponse.data);
      setUserRecipes(recipesResponse.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setError('Пользователь не найден');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavorites = async (): Promise<void> => {
    const status: { [key: number]: boolean } = {};
    for (const recipe of userRecipes) {
      status[recipe.id] = await checkFavoriteStatus(recipe.id);
    }
    setFavoriteStatus(status);
  };

  const handleLike = async (recipeId: number): Promise<void> => {
    try {
      if (favoriteStatus[recipeId]) {
        await removeFromFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: false }));
        setUserRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe.id === recipeId && recipe.likes > 0
              ? { ...recipe, likes: recipe.likes - 1 }
              : recipe,
          ),
        );
      } else {
        await addToFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: true }));
        setUserRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe.id === recipeId ? { ...recipe, likes: recipe.likes + 1 } : recipe,
          ),
        );
      }
    } catch (error: any) {
      alert('Ошибка при добавлении в избранное');
    }
  };

  const toggleRecipe = (recipeId: number): void => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const toggleComments = async (recipeId: number): Promise<void> => {
    if (showComments === recipeId) {
      setShowComments(null);
    } else {
      setShowComments(recipeId);
      await fetchComments(recipeId);
    }
  };

  const handleAddComment = async (recipeId: number, e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await addComment(recipeId, newComment.trim());
      setNewComment('');
      setUserRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, commentCount: recipe.commentCount + 1 } : recipe,
        ),
      );
    } catch (error) {
      alert('Ошибка при добавлении комментария');
    }
  };

  const handleDeleteComment = async (recipeId: number, commentId: number): Promise<void> => {
    if (!window.confirm('Удалить комментарий?')) return;

    try {
      await deleteComment(recipeId, commentId);
      setUserRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, commentCount: recipe.commentCount - 1 } : recipe,
        ),
      );
    } catch (error) {
      alert('Ошибка при удалении комментария');
    }
  };

  const handleReply = (commentId: number): void => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  const handleAddReply = async (
    recipeId: number,
    parentCommentId: number,
    e: React.FormEvent,
  ): Promise<void> => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await addReply(recipeId, parentCommentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
      setUserRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, commentCount: recipe.commentCount + 1 } : recipe,
        ),
      );
    } catch (error) {
      alert('Ошибка при добавлении ответа');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCommentDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className='loading'>Загрузка профиля...</div>;
  }

  if (error || !userProfile) {
    return (
      <div className='error-container'>
        <p>{error || 'Пользователь не найден'}</p>
        <Link to='/'>Вернуться на главную</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className='user-profile-container'>
      <div className='profile-header'>
        <div className='profile-avatar'>
          {userProfile.avatarUrl ? (
            <img
              src={`http://localhost:5000${userProfile.avatarUrl}`}
              alt={userProfile.name}
              className='avatar-image'
            />
          ) : (
            userProfile.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className='profile-info'>
          <h1>{userProfile.name}</h1>
          {isOwnProfile && <p className='profile-email'>{userProfile.email}</p>}
          <p className='profile-join-date'>Участник с {formatDate(userProfile.createdAt)}</p>
          {isOwnProfile && (
            <Link to='/profile' className='edit-profile-link'>
              ⚙️ Мой профиль
            </Link>
          )}
        </div>
      </div>

      <div className='recipes-section'>
        <h2>Рецепты пользователя ({userRecipes.length})</h2>
        {userRecipes.length === 0 ? (
          <p className='no-recipes'>У пользователя пока нет рецептов</p>
        ) : (
          <div className='recipes-feed'>
            {userRecipes.map(recipe => (
              <div key={recipe.id} className='recipe-post'>
                <div className='post-content'>
                  <h3 className='recipe-title' onClick={() => toggleRecipe(recipe.id)}>
                    {recipe.title}
                    <span className='expand-icon'>
                      {expandedRecipeId === recipe.id ? '▼' : '▶'}
                    </span>
                  </h3>
                  <p className='recipe-description'>{recipe.description}</p>
                  {recipe.imageUrl && (
                    <div className='recipe-image-container'>
                      <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />
                    </div>
                  )}
                  <div className='post-header'>
                    <div className='author-info'>
                      <span className='author-name'>{userProfile.name}</span>
                      <span className='post-date'>{formatDate(recipe.createdAt)}</span>
                    </div>
                    <div className='post-actions'>
                      <button
                        className={`like-btn ${favoriteStatus[recipe.id] ? 'liked' : ''}`}
                        onClick={() => handleLike(recipe.id)}
                        title={
                          favoriteStatus[recipe.id]
                            ? 'Удалить из избранного'
                            : 'Добавить в избранное'
                        }
                      >
                        {favoriteStatus[recipe.id] ? '❤️' : '🤍'} {recipe.likes}
                      </button>
                      <button
                        className='comments-btn'
                        onClick={() => toggleComments(recipe.id)}
                        title='Комментарии'
                      >
                        💬 {recipe.commentCount || 0}
                      </button>
                    </div>
                  </div>

                  {expandedRecipeId === recipe.id && (
                    <div className='recipe-details'>
                      <div className='ingredients-section'>
                        <h4>Ингредиенты:</h4>
                        <ul className='ingredients-list'>
                          {recipe.ingredients.split('\n').map((ingredient, index) => (
                            <li key={index}>{ingredient.trim()}</li>
                          ))}
                        </ul>
                      </div>
                      <div className='instructions-section'>
                        <h4>Приготовление:</h4>
                        <ol className='instructions-list'>
                          {recipe.instructions.split('\n').map((instruction, index) => (
                            <li key={index}>{instruction.trim()}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}

                  {showComments === recipe.id && (
                    <div className='comments-section'>
                      <h4>Комментарии ({comments[recipe.id]?.length || 0})</h4>

                      {isAuthenticated ? (
                        <form
                          onSubmit={e => handleAddComment(recipe.id, e)}
                          className='comment-form'
                        >
                          <textarea
                            placeholder='Напишите комментарий...'
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            rows={3}
                            required
                          />
                          <button type='submit' disabled={!newComment.trim()}>
                            Отправить
                          </button>
                        </form>
                      ) : (
                        <p className='login-to-comment'>Войдите, чтобы оставить комментарий</p>
                      )}

                      <div className='comments-list'>
                        {commentsLoading ? (
                          <div className='loading'>Загрузка комментариев...</div>
                        ) : comments[recipe.id]?.length > 0 ? (
                          comments[recipe.id].map(comment => (
                            <div key={comment.id} className='comment'>
                              <div className='comment-header'>
                                <span
                                  className='comment-author'
                                  onClick={() => {
                                    if (comment.author.id !== currentUser?.id) {
                                      navigate(`/user/${comment.author.id}`);
                                    } else {
                                      navigate('/profile');
                                    }
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#007bff',
                                    fontWeight: '600',
                                  }}
                                >
                                  {comment.author.name}
                                </span>
                                <span className='comment-date'>
                                  {formatCommentDate(comment.createdAt)}
                                </span>
                                {currentUser?.id === comment.author.id && (
                                  <button
                                    className='delete-comment-btn'
                                    onClick={() => handleDeleteComment(recipe.id, comment.id)}
                                    title='Удалить комментарий'
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                              <p className='comment-content'>{comment.content}</p>
                              <div className='comment-actions'>
                                <button
                                  className='reply-btn'
                                  onClick={() => handleReply(comment.id)}
                                  title='Ответить'
                                >
                                  💬 Ответить
                                </button>
                                {comment.replyCount > 0 && (
                                  <button className='view-replies-btn' title='Показать ответы'>
                                    📂 {comment.replyCount}{' '}
                                    {comment.replyCount === 1 ? 'ответ' : 'ответов'}
                                  </button>
                                )}
                              </div>

                              {replyingTo === comment.id && (
                                <form
                                  onSubmit={e => handleAddReply(recipe.id, comment.id, e)}
                                  className='reply-form'
                                >
                                  <textarea
                                    placeholder='Напишите ответ...'
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    rows={2}
                                    required
                                  />
                                  <div className='reply-actions'>
                                    <button type='submit' disabled={!replyContent.trim()}>
                                      Отправить
                                    </button>
                                    <button type='button' onClick={() => setReplyingTo(null)}>
                                      Отмена
                                    </button>
                                  </div>
                                </form>
                              )}

                              {comment.replies && comment.replies.length > 0 && (
                                <div className='replies'>
                                  {comment.replies.map(reply => (
                                    <div key={reply.id} className='comment reply'>
                                      <div className='comment-header'>
                                        <span
                                          className='comment-author'
                                          onClick={() => {
                                            if (reply.author.id !== currentUser?.id) {
                                              navigate(`/user/${reply.author.id}`);
                                            } else {
                                              navigate('/profile');
                                            }
                                          }}
                                          style={{
                                            cursor: 'pointer',
                                            color: '#007bff',
                                            fontWeight: '600',
                                          }}
                                        >
                                          {reply.author.name}
                                        </span>
                                        <span className='comment-date'>
                                          {formatCommentDate(reply.createdAt)}
                                        </span>
                                        {currentUser?.id === reply.author.id && (
                                          <button
                                            className='delete-comment-btn'
                                            onClick={() => handleDeleteComment(recipe.id, reply.id)}
                                            title='Удалить ответ'
                                          >
                                            🗑️
                                          </button>
                                        )}
                                      </div>
                                      <p className='comment-content'>{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className='no-comments'>Пока нет комментариев</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
