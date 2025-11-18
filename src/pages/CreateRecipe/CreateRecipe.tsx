import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateRecipe.css';

const CreateRecipe: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);

      // Создаем превью изображения
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (): void => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('ingredients', ingredients);
      formData.append('instructions', instructions);

      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/recipes', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/');
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Ошибка создания рецепта');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='create-recipe'>
      <h2>Создать новый рецепт</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='title'>Название рецепта *</label>
          <input
            id='title'
            type='text'
            placeholder='Введите название рецепта'
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='description'>Описание *</label>
          <textarea
            id='description'
            placeholder='Краткое описание рецепта...'
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={3}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='image'>Изображение рецепта</label>
          <div className='image-upload-container'>
            <input
              id='image'
              type='file'
              accept='image/*'
              onChange={handleImageChange}
              className='image-input'
            />
            <label htmlFor='image' className='image-upload-label'>
              📷 Выбрать фото
            </label>
            {imagePreview && (
              <div className='image-preview'>
                <img src={imagePreview} alt='Preview' />
                <button type='button' onClick={removeImage} className='remove-image-btn'>
                  ✕
                </button>
              </div>
            )}
          </div>
          <small>Поддерживаются JPG, PNG (макс. 5MB)</small>
        </div>

        <div className='form-group'>
          <label htmlFor='ingredients'>Ингредиенты *</label>
          <textarea
            id='ingredients'
            placeholder='Каждый ингредиент с новой строки:&#10;• 200г муки&#10;• 2 яйца&#10;• 100мл молока'
            value={ingredients}
            onChange={e => setIngredients(e.target.value)}
            required
            rows={6}
          />
          <small>Каждый ингредиент с новой строки</small>
        </div>

        <div className='form-group'>
          <label htmlFor='instructions'>Инструкции приготовления *</label>
          <textarea
            id='instructions'
            placeholder='Каждый шаг с новой строки:&#10;1. Смешать сухие ингредиенты&#10;2. Добавить яйца и молоко&#10;3. Выпекать 30 минут'
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            required
            rows={8}
          />
          <small>Каждый шаг с новой строки</small>
        </div>

        <button type='submit' disabled={isLoading}>
          {isLoading ? 'Публикация...' : 'Опубликовать рецепт'}
        </button>
      </form>
    </div>
  );
};

export default CreateRecipe;
