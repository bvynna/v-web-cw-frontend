import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../app/store/profileStore';
import { useAuthStore } from '../../app/store/authStore';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  createdAt: string;
  author: {
    id: number;
  };
  ingredients: string;
  instructions: string;
}

const Profile: React.FC = () => {
  const { profile, myRecipes, isLoading, fetchProfile, fetchMyRecipes, updateProfile } =
    useProfileStore();
  const { user } = useAuthStore();
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'recipes' | 'settings'>('recipes');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(myRecipes);
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchMyRecipes();
  }, [fetchProfile, fetchMyRecipes]);

  useEffect(() => {
    // Фильтрация рецептов по категории
    if (selectedCategory === 'all') {
      setFilteredRecipes(myRecipes);
    } else {
      setFilteredRecipes(myRecipes.filter(recipe => recipe.category === selectedCategory));
    }
  }, [myRecipes, selectedCategory]);

  useEffect(() => {
    // Проверяем статусы избранного для каждого рецепта
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

  const getCategoryIcon = (category: string): string => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label.split(' ')[0] : '📝';
  };

  const handleSaveProfile = async (): Promise<void> => {
    try {
      await updateProfile(editName, editEmail);
      setIsEditing(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update profile');
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

      // Обновляем локальное состояние
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

  if (isLoading && !profile) {
    return <div className='loading'>Загрузка профиля...</div>;
  }

  return (
    <div className='profile-container'>
      <div className='profile-header'>
        <div className='profile-avatar'>{profile?.name?.charAt(0).toUpperCase() || 'U'}</div>
        <div className='profile-info'>
          <h1>{profile?.name || 'Пользователь'}</h1>
          <p className='profile-email'>{profile?.email}</p>
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
                  <div
                    key={recipe.id}
                    className={`recipe-post ${expandedRecipeId === recipe.id ? 'expanded' : ''}`}
                    onClick={() => openRecipe(recipe.id)}
                  >
                    <div className='post-header'>
                      <div className='author-info'>
                        <span className='author-name'>{profile?.name}</span>
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
                          className={`like-btn ${favoriteStatus[recipe.id] ? 'liked' : ''}`}
                          onClick={e => handleFavorite(recipe.id, e)}
                          title={
                            favoriteStatus[recipe.id]
                              ? 'Удалить из избранного'
                              : 'Добавить в избранное'
                          }
                        >
                          {favoriteStatus[recipe.id] ? '❤️' : '🤍'} {recipe.likes}
                        </button>
                        <button
                          className='delete-btn'
                          onClick={e => {
                            e.stopPropagation();
                            deleteRecipe(recipe.id);
                          }}
                          title='Удалить рецепт'
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className='post-content'>
                      <h3 className='recipe-title'>
                        {recipe.title}
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

              <div className='form-actions'>
                {isEditing ? (
                  <>
                    <button
                      className='save-btn'
                      onClick={handleSaveProfile}
                      disabled={!editName.trim() || !editEmail.trim()}
                    >
                      Сохранить
                    </button>
                    <button
                      className='cancel-btn'
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(profile?.name || '');
                        setEditEmail(profile?.email || '');
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
    </div>
  );
};

export default Profile;
