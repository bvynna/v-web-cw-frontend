import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../../app/store/profileStore';
import { useAuthStore } from '../../app/store/authStore';
import axios from 'axios';
import './Profile.css';

interface Recipe {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  likes: number;
  createdAt: string;
  author: {
    id: number;
  };
}

const Profile: React.FC = () => {
  const { profile, myRecipes, isLoading, fetchProfile, fetchMyRecipes, updateProfile } =
    useProfileStore();
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'recipes' | 'settings'>('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>(myRecipes);

  useEffect(() => {
    fetchProfile();
    fetchMyRecipes();
  }, [fetchProfile, fetchMyRecipes]);

  useEffect(() => {
    setRecipes(myRecipes);
  }, [myRecipes]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
    }
  }, [profile]);

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

      // Удаляем рецепт из состояния
      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
      // Также обновляем в store
      fetchMyRecipes();
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
          📖 Мои рецепты ({recipes.length})
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
            <h2>Мои рецепты</h2>
            {recipes.length === 0 ? (
              <div className='empty-state'>
                <p>У вас пока нет рецептов</p>
                <a href='/create' className='create-recipe-link'>
                  Создать первый рецепт
                </a>
              </div>
            ) : (
              <div className='my-recipes-grid'>
                {recipes.map(recipe => (
                  <div key={recipe.id} className='recipe-card'>
                    {recipe.imageUrl && (
                      <div className='recipe-image'>
                        <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />
                      </div>
                    )}
                    <div className='recipe-content'>
                      <h3>{recipe.title}</h3>
                      <p className='recipe-description'>{recipe.description}</p>
                      <div className='recipe-actions'>
                        <div className='recipe-likes'>❤️ {recipe.likes}</div>
                        <button
                          className='delete-recipe-btn'
                          onClick={() => deleteRecipe(recipe.id)}
                          title='Удалить рецепт'
                        >
                          🗑️
                        </button>
                      </div>
                      <div className='recipe-date'>{formatDate(recipe.createdAt)}</div>
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
