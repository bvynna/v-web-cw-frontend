import React, { useState, useEffect } from 'react';
import { useFavoriteStore } from '../../app/store/favoriteStore';
import './Favorites.css';

const Favorites: React.FC = () => {
  const { favorites, isLoading, fetchFavorites, removeFromFavorites } = useFavoriteStore();
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleRecipe = (recipeId: number): void => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const handleRemoveFavorite = async (recipeId: number): Promise<void> => {
    try {
      await removeFromFavorites(recipeId);
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
        <p className='favorites-count'>{favorites.length} рецептов в избранном</p>
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
        <div className='favorites-feed'>
          {favorites.map(recipe => (
            <div key={recipe.id} className='recipe-post favorite-post'>
              <div className='post-header'>
                <div className='author-info'>
                  <span className='author-name'>{recipe.author.name}</span>
                  <span className='post-date'>{formatDate(recipe.createdAt)}</span>
                </div>
                <div className='post-actions'>
                  <div className='likes-count'>❤️ {recipe.likes}</div>
                  <button
                    className='remove-favorite-btn'
                    onClick={() => handleRemoveFavorite(recipe.id)}
                    title='Удалить из избранного'
                  >
                    ❌
                  </button>
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
      )}
    </div>
  );
};

export default Favorites;
