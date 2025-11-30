import React, { useState, useEffect } from 'react';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import { useCommentStore } from '../../app/store/commentStore'; // Добавьте этот импорт
import { useAuthStore } from '../../app/store/authStore'; // Добавьте этот импорт
import './Favorites.css';

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
  const { user, isAuthenticated } = useAuthStore(); // Добавлено
  const {
    comments,
    isLoading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
  } = useCommentStore(); // Добавлено
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredFavorites, setFilteredFavorites] = useState<Recipe[]>(favorites);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComments, setShowComments] = useState<number | null>(null); // Добавлено
  const [newComment, setNewComment] = useState(''); // Добавлено

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  useEffect(() => {
    let result = favorites;

    if (selectedCategory !== 'all') {
      result = result.filter(recipe => recipe.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        recipe =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description.toLowerCase().includes(query),
      );
    }

    setFilteredFavorites(result);
  }, [favorites, selectedCategory, searchQuery]);

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
      fetchFavorites(); // Обновляем избранное чтобы обновить счетчик комментариев
    } catch (error) {
      alert('Ошибка при добавлении комментария');
    }
  };

  const handleDeleteComment = async (recipeId: number, commentId: number): Promise<void> => {
    if (!window.confirm('Удалить комментарий?')) return;

    try {
      await deleteComment(recipeId, commentId);
      fetchFavorites(); // Обновляем избранное чтобы обновить счетчик комментариев
    } catch (error) {
      alert('Ошибка при удалении комментария');
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
                      <span className='author-name'>{recipe.author.name}</span>
                      <span className='post-date'>{formatDate(recipe.createdAt)}</span>
                    </div>
                    <div className='post-meta'>
                      <span className='recipe-category'>
                        {getCategoryIcon(recipe.category)}{' '}
                        {CATEGORIES.find(c => c.value === recipe.category)?.label.split(' ')[1]}
                      </span>
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
                                <span className='comment-author'>{comment.author.name}</span>
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
    </div>
  );
};

export default Favorites;
