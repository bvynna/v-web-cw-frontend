// pages/UserProfile/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);

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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className='loading'>Загрузка профиля...</div>;
  }

  if (error || !userProfile) {
    return (
      <div className='error-container'>
        <h2>{error || 'Пользователь не найден'}</h2>
        <Link to='/'>Вернуться на главную</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className='user-profile-container'>
      <div className='profile-header'>
        <div className='profile-avatar'>{userProfile.name.charAt(0).toUpperCase()}</div>
        <div className='profile-info'>
          <h1>{userProfile.name}</h1>
          <p className='profile-email'>{userProfile.email}</p>
          <p className='profile-join-date'>Участник с {formatDate(userProfile.createdAt)}</p>
          {isOwnProfile && (
            <Link to='/profile' className='edit-profile-link'>
              ⚙️ Мой профиль
            </Link>
          )}
        </div>
      </div>

      <div className='user-recipes-section'>
        <h2>Рецепты пользователя ({userRecipes.length})</h2>

        {userRecipes.length === 0 ? (
          <div className='empty-state'>
            <p>У пользователя пока нет рецептов</p>
          </div>
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
                      <div className='recipe-image'>
                        <img src={`http://localhost:5000${recipe.imageUrl}`} alt={recipe.title} />
                      </div>
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
                      <button className='comments-btn' title='Комментарии'>
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
