import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../app/store/authStore';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import './Recipes.css';

interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  likes: number;
  imageUrl?: string;
  author: {
    id: number;
    name: string;
  };
  createdAt: string;
}

const Recipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const { addToFavorites, removeFromFavorites, checkFavoriteStatus } = useFavoriteStore();
  const [favoriteStatus, setFavoriteStatus] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchRecipes();
  }, []);

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

  return (
    <div className='recipes-container'>
      <h2>Лента рецептов</h2>
      <div className='recipes-feed'>
        {recipes.map(recipe => (
          <div key={recipe.id} className='recipe-post'>
            <div className='post-header'>
              <div className='author-info'>
                <span className='author-name'>{recipe.author.name}</span>
                <span className='post-date'>{formatDate(recipe.createdAt)}</span>
              </div>
              <div className='post-actions'>
                <button
                  className={`like-btn ${favoriteStatus[recipe.id] ? 'liked' : ''}`}
                  onClick={() => handleLike(recipe.id)}
                  title={
                    favoriteStatus[recipe.id] ? 'Удалить из избранного' : 'Добавить в избранное'
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recipes;
