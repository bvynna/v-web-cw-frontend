import React, { useState, useEffect } from 'react';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import { useCommentStore } from '../../app/store/commentStore';
import { useAuthStore } from '../../app/store/authStore';
import { useNavigate } from 'react-router-dom';
import './Favorites.css';
import LikesList from '../../components/Recipes/LikesList';

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
    name: string;
  };
  ingredients: string;
  instructions: string;
}

const Favorites: React.FC = () => {
  const { favorites, isLoading, fetchFavorites, removeFromFavorites } = useFavoriteStore();
  const { user, isAuthenticated } = useAuthStore();
  const {
    comments,
    isLoading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
    addReply,
  } = useCommentStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredFavorites, setFilteredFavorites] = useState<Recipe[]>(favorites);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComments, setShowComments] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [selectedRecipeIdForLikes, setSelectedRecipeIdForLikes] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    let result = favorites;

    if (searchQuery.trim()) {
      result = result.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(recipe => recipe.category === selectedCategory);
    }

    setFilteredFavorites(result);
  }, [favorites, searchQuery, selectedCategory]);

  const handleReply = (commentId: number): void => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent('');
  };

  const handleShowLikes = (recipeId: number) => {
    setSelectedRecipeIdForLikes(recipeId);
    setShowLikesModal(true);
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
      setFilteredFavorites(prevFavorites =>
        prevFavorites.map(recipe =>
          recipe.id === recipeId ? { ...recipe, commentCount: recipe.commentCount + 1 } : recipe,
        ),
      );
    } catch (error) {
      alert('Ошибка при добавлении ответа');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = (): void => {
    setSearchQuery('');
  };

  const getCategoryIcon = (category: string): string => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : '📝';
  };

  const toggleRecipe = (recipeId: number): void => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  // Добавьте функции для комментариев
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
      setFilteredFavorites(prevFavorites =>
        prevFavorites.map(recipe =>
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

      setFilteredFavorites(prevFavorites =>
        prevFavorites.map(recipe =>
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

  const handleRemoveFavorite = async (recipeId: number): Promise<void> => {
    try {
      await removeFromFavorites(recipeId);
      // Автоматически обновится через состояние хранилища
    } catch (error) {
      alert('Ошибка при удалении из избранного');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <div className='loading'>Загрузка избранных рецептов...</div>;
  }

  return (
    <div className='favorites-container'>
      <div className='favorites-header'>
        <h1>❤️ Избранные рецепты</h1>
        <p className='favorites-count'>{filteredFavorites.length} рецептов в избранном</p>
      </div>

      {favorites.length === 0 ? (
        <div className='empty-favorites'>
          <div className='empty-icon'>❤️</div>
          <h2>В избранном пока пусто</h2>
          <p>Добавляйте понравившиеся рецепты, нажимая на сердечко</p>
          <a href='/' className='browse-recipes-link'>
            Перейти к рецептам
          </a>
        </div>
      ) : (
        <>
          <div className='search-container'>
            <div className='search-input-wrapper'>
              <input
                type='text'
                placeholder='🔍 Поиск в избранном...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='search-input'
              />
              {searchQuery && (
                <button className='clear-search-btn' onClick={clearSearch} title='Очистить поиск'>
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <div className='search-results-info'>
                Найдено рецептов: {filteredFavorites.length}
              </div>
            )}
          </div>
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

          <div className='favorites-feed'>
            {filteredFavorites.map(recipe => (
              <div key={recipe.id} className='recipe-post favorite-post'>
                <div className='post-content'>
                  {/* Название и описание вверху */}
                  <h3 className='recipe-title' onClick={() => toggleRecipe(recipe.id)}>
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

                  {/* Фотография */}
                  {recipe.imageUrl && (
                    <div className='recipe-image-container'>
                      <div className='recipe-image'>
                        <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />
                      </div>
                    </div>
                  )}

                  {/* Шапка с информацией и действиями под фото */}
                  <div className='post-header'>
                    <div className='author-info'>
                      <span
                        className='author-name'
                        onClick={e => {
                          e.stopPropagation();
                          if (recipe.author.id !== currentUser?.id) {
                            navigate(`/user/${recipe.author.id}`);
                          }
                        }}
                        style={{
                          cursor: recipe.author.id !== currentUser?.id ? 'pointer' : 'default',
                          color: recipe.author.id !== currentUser?.id ? '#007bff' : '#333',
                        }}
                        title={recipe.author.id !== currentUser?.id ? 'Посмотреть профиль' : ''}
                      >
                        {recipe.author.name}
                      </span>
                      <span className='post-date'>{formatDate(recipe.createdAt)}</span>
                    </div>

                    <div className='post-actions'>
                      <button
                        className='like-btn liked'
                        onClick={() => handleRemoveFavorite(recipe.id)}
                        title='Удалить из избранного'
                      >
                        ❤️ {recipe.likes}
                      </button>
                      <button
                        className='comments-btn'
                        onClick={e => {
                          e.stopPropagation();
                          toggleComments(recipe.id);
                        }}
                        title='Комментарии'
                      >
                        💬 {recipe.commentCount || 0}
                      </button>
                      {recipe.likes > 0 && (
                        <div className='likes-info'>
                          <span className='likes-link' onClick={() => handleShowLikes(recipe.id)}>
                            Посмотреть все лайки ({recipe.likes})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Детали рецепта при раскрытии */}
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

                  {/* Комментарии */}
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
                                  title={
                                    comment.author.id !== currentUser?.id
                                      ? 'Посмотреть профиль'
                                      : 'Перейти в мой профиль'
                                  }
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
                                    📂
                                    {comment.replyCount}{' '}
                                    {comment.replyCount === 1 ? 'ответ' : 'ответов'}
                                  </button>
                                )}
                              </div>

                              {/* Форма ответа */}
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

                              {/* Отображение ответов */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className='replies'>
                                  {comment.replies.map(reply => (
                                    <div key={reply.id} className='comment reply'>
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
                                          title={
                                            reply.author.id !== currentUser?.id
                                              ? 'Посмотреть профиль'
                                              : 'Перейти в мой профиль'
                                          }
                                        >
                                          {reply.author.name}
                                        </span>
                                        <span className='comment-date'>
                                          {formatCommentDate(reply.createdAt)}
                                        </span>
                                        {user?.id === reply.author.id && (
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
        </>
      )}
      {showLikesModal && selectedRecipeIdForLikes && (
        <LikesList recipeId={selectedRecipeIdForLikes} onClose={() => setShowLikesModal(false)} />
      )}
    </div>
  );
};

export default Favorites;
