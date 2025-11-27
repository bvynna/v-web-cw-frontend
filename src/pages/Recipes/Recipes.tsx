import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCommentStore } from '../../app/store/commentStore';
import { useAuthStore } from '../../app/store/authStore';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import './Recipes.css';

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

interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  category: string;
  likes: number;
  commentCount: number;
  imageUrl?: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});
  const [showComments, setShowComments] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const {
    comments,
    isLoading: commentsLoading,
    fetchComments,
    addComment,
    deleteComment,
  } = useCommentStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    let result = recipes;

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

    setFilteredRecipes(result);
  }, [recipes, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteStatus({});
      fetchRecipes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const checkFavorites = async () => {
      if (!isAuthenticated || recipes.length === 0) {
        setFavoriteStatus({});
        return;
      }

      const status: { [key: number]: boolean } = {};
      for (const recipe of recipes) {
        status[recipe.id] = await checkFavoriteStatus(recipe.id);
      }
      setFavoriteStatus(status);
    };

    checkFavorites();
  }, [recipes, checkFavoriteStatus, isAuthenticated]);

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

  const fetchRecipes = async (): Promise<void> => {
    try {
      const response = await axios.get('http://localhost:5000/api/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error('Failed to fetch recipes');
    }
  };

  const toggleRecipe = (recipeId: number): void => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
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

      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
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

  const handleLike = async (recipeId: number): Promise<void> => {
    if (!isAuthenticated) {
      alert('Войдите в аккаунт чтобы добавлять в избранное');
      return;
    }

    try {
      if (favoriteStatus[recipeId]) {
        // Удаляем из избранного
        await removeFromFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: false }));

        // Обновляем счетчик лайков
        setRecipes(prevRecipes =>
          prevRecipes.map(recipe =>
            recipe.id === recipeId && recipe.likes > 0
              ? { ...recipe, likes: recipe.likes - 1 }
              : recipe,
          ),
        );
      } else {
        // Добавляем в избранное
        await addToFavorites(recipeId);
        setFavoriteStatus(prev => ({ ...prev, [recipeId]: true }));

        // Обновляем счетчик лайков
        setRecipes(prevRecipes =>
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isUserAuthor = (recipeAuthorId: number): boolean => {
    return user?.id === recipeAuthorId;
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
    } catch (error) {
      alert('Ошибка при добавлении комментария');
    }
  };

  const handleDeleteComment = async (recipeId: number, commentId: number): Promise<void> => {
    if (!window.confirm('Удалить комментарий?')) return;

    try {
      await deleteComment(recipeId, commentId);
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

  return (
    <div className='recipes-container'>
      <div className='recipes-header'>
        <h2>Лента рецептов</h2>
        <div className='search-container'>
          <div className='search-input-wrapper'>
            <input
              type='text'
              placeholder='🔍 Поиск рецептов...'
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
            <div className='search-results-info'>Найдено рецептов: {filteredRecipes.length}</div>
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
      </div>

      <div className='recipes-feed'>
        {filteredRecipes.length === 0 ? (
          <div className='empty-search-results'>
            <div className='empty-search-icon'>🔍</div>
            <h3>
              {searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : 'Рецепты не найдены'}
            </h3>
            <p>
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос или выбрать другую категорию'
                : 'Попробуйте выбрать другую категорию'}
            </p>
            {searchQuery && (
              <button className='clear-search-large-btn' onClick={clearSearch}>
                Очистить поиск
              </button>
            )}
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <div key={recipe.id} className='recipe-post'>
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
                    className='comments-btn'
                    onClick={() => toggleComments(recipe.id)}
                    title='Комментарии'
                  >
                    💬 {recipe.commentCount || 0}
                  </button>
                  <button
                    className={`like-btn ${favoriteStatus[recipe.id] ? 'liked' : ''}`}
                    onClick={() => handleLike(recipe.id)}
                    title={
                      isAuthenticated
                        ? favoriteStatus[recipe.id]
                          ? 'Удалить из избранного'
                          : 'Добавить в избранное'
                        : 'Войдите чтобы добавить в избранное'
                    }
                  >
                    {favoriteStatus[recipe.id] ? '❤️' : '🤍'} {recipe.likes}
                  </button>
                  {isUserAuthor(recipe.author.id) && (
                    <button
                      className='delete-btn'
                      onClick={() => deleteRecipe(recipe.id)}
                      title='Удалить рецепт'
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className='post-content'>
                <h3 className='recipe-title' onClick={() => toggleRecipe(recipe.id)}>
                  {recipe.title}
                  <span className='expand-icon'>{expandedRecipeId === recipe.id ? '▼' : '▶'}</span>
                </h3>

                <p className='recipe-description'>{recipe.description}</p>

                {recipe.imageUrl && (
                  <div className='recipe-image-container'>
                    <div className='recipe-image'>
                      <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />
                    </div>
                  </div>
                )}

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
                      <form onSubmit={e => handleAddComment(recipe.id, e)} className='comment-form'>
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
          ))
        )}
      </div>
    </div>
  );
};

export default Recipes;
