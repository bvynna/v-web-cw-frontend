import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../app/store/profileStore';
import { useAuthStore } from '../../app/store/authStore';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import { useCommentStore } from '../../app/store/commentStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useSubscriptionStore } from '../../app/store/subscriptionStore';
import SubscribersList from '../../components/Profile/SubscribersList';
import LikesList from '../../components/Recipes/LikesList';
import './Profile.css';

const CATEGORIES = [
  { value: 'all', label: '📝 Все рецепты' },
  { value: 'breakfast', label: '🍳 Завтрак' },
  { value: 'lunch', label: '🍲 Обед' },
  { value: 'dinner', label: '🍽️ Ужин' },
  { value: 'dessert', label: '🍰 Десерт' },
  { value: 'snack', label: '🥨 Перекус' },
  { value: 'drink', label: '🥤 Напиток' },
  { value: 'salad', label: '🥗 Салат' },
  { value: 'soup', label: '🍜 Суп' },
  { value: 'bakery', label: '🥐 Выпечка' },
];

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
  };
  ingredients: string;
  instructions: string;
}

const Profile: React.FC = () => {
  const location = useLocation();
  const { profile, myRecipes, isLoading, fetchProfile, fetchMyRecipes, updateProfile } =
    useProfileStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'recipes' | 'settings'>('recipes');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(myRecipes);
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [showComments, setShowComments] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const {
    comments,
    isLoading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
    addReply,
  } = useCommentStore();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingScrollToRecipe, setPendingScrollToRecipe] = useState<number | null>(null);
  const { fetchSubscribersCount, subscribersCount } = useSubscriptionStore();
  const [mySubscribersCount, setMySubscribersCount] = useState(0);
  const [showSubscribersModal, setShowSubscribersModal] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedRecipeIdForLikes, setSelectedRecipeIdForLikes] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      fetchSubscribersCount(profile.id);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setMySubscribersCount(subscribersCount[profile.id] || 0);
    }
  }, [subscribersCount, profile]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [user]);

  // Получаем данные из location state
  useEffect(() => {
    const state = location.state as {
      scrollToRecipeId?: number;
      commentId?: number;
      notificationType?: string;
    };
    if (state?.scrollToRecipeId) {
      setPendingScrollToRecipe(state.scrollToRecipeId);
      setSelectedCategory('all');
      setActiveTab('recipes');

      // Сохраняем тип уведомления и ID комментария
      if (state.notificationType) {
        sessionStorage.setItem('notificationType', state.notificationType);
      }
      if (state.commentId) {
        sessionStorage.setItem('commentId', state.commentId.toString());
      }

      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Скроллим к нужному элементу
  useEffect(() => {
    if (
      pendingScrollToRecipe &&
      filteredRecipes.length > 0 &&
      !isLoading &&
      activeTab === 'recipes'
    ) {
      const recipeId = pendingScrollToRecipe;
      const notificationType = sessionStorage.getItem('notificationType');
      const commentId = sessionStorage.getItem('commentId');

      const timer = setTimeout(() => {
        const recipeElement = document.getElementById(`recipe-${recipeId}`);

        if (recipeElement) {
          if (notificationType === 'comment' || notificationType === 'reply') {
            setShowComments(recipeId);

            setTimeout(() => {
              if (commentId) {
                const commentElement = document.getElementById(`comment-${commentId}`);
                if (commentElement) {
                  commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  commentElement.classList.add('highlighted');
                  setTimeout(() => commentElement.classList.remove('highlighted'), 2000);
                }
              } else {
                const commentsSection = recipeElement.querySelector('.comments-section');
                if (commentsSection) {
                  commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }, 500);
          } else if (notificationType === 'like') {
            recipeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
              const likeButton = recipeElement.querySelector('.like-btn');
              if (likeButton) {
                likeButton.classList.add('highlighted-like');
                setTimeout(() => likeButton.classList.remove('highlighted-like'), 2000);
              }
            }, 300);
          } else {
            recipeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            recipeElement.classList.add('highlighted');
            setTimeout(() => recipeElement.classList.remove('highlighted'), 2000);
          }

          sessionStorage.removeItem('notificationType');
          sessionStorage.removeItem('commentId');
          setPendingScrollToRecipe(null);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pendingScrollToRecipe, filteredRecipes, isLoading, activeTab, comments]);

  useEffect(() => {
    fetchProfile();
    fetchMyRecipes();
  }, [fetchProfile, fetchMyRecipes]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredRecipes(myRecipes);
    } else {
      setFilteredRecipes(myRecipes.filter(recipe => recipe.category === selectedCategory));
    }
  }, [myRecipes, selectedCategory]);

  useEffect(() => {
    const checkFavorites = async () => {
      const status: { [key: number]: boolean } = {};
      for (const recipe of filteredRecipes) {
        status[recipe.id] = await checkFavoriteStatus(recipe.id);
      }
      setFavoriteStatus(status);
    };

    if (filteredRecipes.length > 0) {
      checkFavorites();
    }
  }, [filteredRecipes, checkFavoriteStatus]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
  }, [profile]);

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
      setFilteredRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId ? { ...recipe, commentCount: recipe.commentCount + 1 } : recipe,
        ),
      );
    } catch (error) {
      alert('Ошибка при добавлении ответа');
    }
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
      setFilteredRecipes(prevRecipes =>
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

      await fetchComments(recipeId);

      setFilteredRecipes(prevRecipes =>
        prevRecipes.map(recipe =>
          recipe.id === recipeId
            ? { ...recipe, commentCount: Math.max(0, recipe.commentCount - 1) }
            : recipe,
        ),
      );
    } catch (error) {
      alert('Не удалось удалить комментарий');
    }
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

  const getCategoryIcon = (category: string): string => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : '📝';
  };

  // Выбор файла: сразу показываем превью в настройках
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Сохранение: загрузка на сервер + обновление профиля
  const handleSaveProfile = async (): Promise<void> => {
    try {
      setIsUploadingAvatar(true);

      if (avatarFile) {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        await axios.post('http://localhost:5000/api/users/profile/avatar', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      await updateProfile(editName, editEmail);
      await fetchProfile();

      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Не удалось обновить профиль');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const deleteRecipe = async (recipeId: number): Promise<void> => {
    if (!window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/recipes/${recipeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedRecipes = filteredRecipes.filter(recipe => recipe.id !== recipeId);
      setFilteredRecipes(updatedRecipes);
      alert('Рецепт успешно удален');
    } catch (error: any) {
      console.error('Failed to delete recipe:', error);
      if (error.response?.status === 403) {
        alert('Вы можете удалять только свои рецепты');
      } else {
        alert('Ошибка при удалении рецепта');
      }
    }
  };

  const handleFavorite = async (recipeId: number, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();

    try {
      if (favoriteStatus[recipeId]) {
        await removeFromFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: false }));
        setFilteredRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe.id === recipeId && recipe.likes > 0
              ? { ...recipe, likes: recipe.likes - 1 }
              : recipe,
          ),
        );
      } else {
        await addToFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: true }));
        setFilteredRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe.id === recipeId ? { ...recipe, likes: recipe.likes + 1 } : recipe,
          ),
        );
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      if (error.response?.status === 400) {
        alert('Рецепт уже в избранном');
      } else {
        alert('Ошибка при добавлении в избранное');
      }
    }
  };

  const openRecipe = (recipeId: number): void => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShowLikes = (recipeId: number) => {
    setSelectedRecipeIdForLikes(recipeId);
    setShowLikesModal(true);
  };

  if (isLoading && !profile) {
    return <div className='loading'>Загрузка профиля...</div>;
  }

  return (
    <div className='profile-container'>
      <div className='profile-header'>
        <div className='profile-avatar'>
          {profile?.avatarUrl ? (
            <img
              src={`http://localhost:5000${profile.avatarUrl}`}
              alt={profile.name}
              className='avatar-image'
            />
          ) : (
            (profile?.name?.charAt(0).toUpperCase() ?? 'U')
          )}
        </div>

        <div className='profile-info'>
          <h1>{profile?.name || 'Пользователь'}</h1>
          <p className='profile-email'>{profile?.email}</p>
          <p
            className='subscribers-count clickable'
            onClick={() => setShowSubscribersModal(true)}
            title='Посмотреть подписчиков'
          >
            👥 Подписчиков: {mySubscribersCount}
          </p>
          <p className='profile-join-date'>
            Участник с {profile ? formatDate(profile.createdAt) : '...'}
          </p>
        </div>
      </div>

      <div className='profile-tabs'>
        <button
          className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          📖 Мои рецепты ({filteredRecipes.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Настройки
        </button>
      </div>

      <div className='profile-content'>
        {activeTab === 'recipes' && (
          <div className='recipes-tab'>
            <div className='recipes-header'>
              <h2>Мои рецепты</h2>
              <div className='category-filters'>
                {CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    className={`category-filter ${selectedCategory === category.value ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredRecipes.length === 0 ? (
              <div className='empty-state'>
                <p>
                  {selectedCategory === 'all'
                    ? 'У вас пока нет рецептов'
                    : `У вас пока нет рецептов в категории "${CATEGORIES.find(c => c.value === selectedCategory)?.label}"`}
                </p>
                <a href='/create' className='create-recipe-link'>
                  Создать рецепт
                </a>
              </div>
            ) : (
              <div className='my-recipes-feed'>
                {filteredRecipes.map(recipe => (
                  <div key={recipe.id} id={`recipe-${recipe.id}`} className='recipe-post'>
                    <div className='post-content'>
                      <h3 className='recipe-title' onClick={() => openRecipe(recipe.id)}>
                        {recipe.title}
                        <div className='post-meta'>
                          <span className='recipe-category'>
                            {getCategoryIcon(recipe.category)}{' '}
                            {CATEGORIES.find(c => c.value === recipe.category)?.label.split(' ')[1]}
                          </span>
                        </div>
                        <span className='expand-icon'>
                          {expandedRecipeId === recipe.id ? '▼' : '▶'}
                        </span>
                      </h3>
                      <p className='recipe-description'>{recipe.description}</p>
                      {recipe.imageUrl && (
                        <div className='recipe-image-container'>
                          <div className='recipe-image'>
                            <img
                              src={`http://localhost:5000${recipe.imageUrl}`}
                              alt={recipe.title}
                            />
                          </div>
                        </div>
                      )}
                      <div className='post-header'>
                        <div className='author-info'>
                          <span className='author-name'>{profile?.name}</span>
                          <span className='post-date'>{formatDate(recipe.createdAt)}</span>
                        </div>
                        <div className='post-actions'>
                          <button
                            className={`like-btn ${favoriteStatus[recipe.id] ? 'liked' : ''}`}
                            onClick={e => handleFavorite(recipe.id, e)}
                          >
                            {favoriteStatus[recipe.id] ? '❤️' : '🤍'} {recipe.likes}
                          </button>
                          <button
                            className='comments-btn'
                            onClick={e => {
                              e.stopPropagation();
                              toggleComments(recipe.id);
                            }}
                          >
                            💬 {recipe.commentCount || 0}
                          </button>
                          <button
                            className='delete-btn'
                            onClick={e => {
                              e.stopPropagation();
                              deleteRecipe(recipe.id);
                            }}
                          >
                            🗑️
                          </button>
                          {recipe.likes > 0 && (
                            <div className='likes-info'>
                              <span
                                className='likes-link'
                                onClick={() => handleShowLikes(recipe.id)}
                              >
                                Посмотреть все лайки ({recipe.likes})
                              </span>
                            </div>
                          )}
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
                                <div
                                  key={comment.id}
                                  id={`comment-${comment.id}`}
                                  className='comment'
                                >
                                  <div className='comment-header'>
                                    <span
                                      className='comment-author'
                                      onClick={e => {
                                        e.stopPropagation();
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
                                    {user?.id === comment.author.id && (
                                      <button
                                        className='delete-comment-btn'
                                        onClick={() => handleDeleteComment(recipe.id, comment.id)}
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
                                    >
                                      💬 Ответить
                                    </button>
                                    {comment.replyCount > 0 && (
                                      <button className='view-replies-btn'>
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
                                        <div
                                          key={reply.id}
                                          id={`comment-${reply.id}`}
                                          className='comment reply'
                                        >
                                          <div className='comment-header'>
                                            <span
                                              className='comment-author'
                                              onClick={e => {
                                                e.stopPropagation();
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
                                            {user?.id === reply.author.id && (
                                              <button
                                                className='delete-comment-btn'
                                                onClick={() =>
                                                  handleDeleteComment(recipe.id, reply.id)
                                                }
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
        )}

        {activeTab === 'settings' && (
          <div className='settings-tab'>
            <h2>Настройки профиля</h2>
            <div className='settings-form'>
              <div className='form-group'>
                <label htmlFor='name'>Имя</label>
                {isEditing ? (
                  <input
                    id='name'
                    type='text'
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                ) : (
                  <div className='display-value'>{profile?.name}</div>
                )}
              </div>

              <div className='form-group'>
                <label htmlFor='email'>Email</label>
                {isEditing ? (
                  <input
                    id='email'
                    type='email'
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                  />
                ) : (
                  <div className='display-value'>{profile?.email}</div>
                )}
              </div>

              {/* ПРЕВЬЮ В НАСТРОЙКАХ: показывает avatarPreview (если выбран файл) или сохранённый аватар */}
              <div className='form-group'>
                <label>Аватар</label>
                <div className='avatar-settings'>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt='Превью аватара' className='avatar-preview' />
                  ) : profile?.avatarUrl ? (
                    <img
                      src={`http://localhost:5000${profile.avatarUrl}`}
                      alt={profile.name}
                      className='avatar-preview'
                    />
                  ) : (
                    <div className='avatar-placeholder'>
                      {profile?.name?.charAt(0).toUpperCase() ?? 'У'}
                    </div>
                  )}

                  {isEditing && (
                    <>
                      <input
                        id='avatar-input'
                        type='file'
                        accept='image/*'
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor='avatar-input' className='upload-avatar-btn'>
                        📷 Выбрать фото
                      </label>
                      {avatarFile && <p className='file-selected'>Выбран: {avatarFile.name}</p>}
                    </>
                  )}
                </div>
              </div>

              <div className='form-actions'>
                {isEditing ? (
                  <>
                    <button
                      className='save-btn'
                      onClick={handleSaveProfile}
                      disabled={!editName.trim() || !editEmail.trim() || isUploadingAvatar}
                    >
                      {isUploadingAvatar ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      className='cancel-btn'
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.name || '');
                        setEditEmail(profile?.email || '');
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <button className='edit-btn' onClick={() => setIsEditing(true)}>
                    Редактировать профиль
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showSubscribersModal && profile && (
        <SubscribersList userId={profile.id} onClose={() => setShowSubscribersModal(false)} />
      )}

      {showLikesModal && selectedRecipeIdForLikes && (
        <LikesList recipeId={selectedRecipeIdForLikes} onClose={() => setShowLikesModal(false)} />
      )}
    </div>
  );
};

export default Profile;
