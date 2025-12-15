import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/authStore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await register(email, password, name);
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка регистрации';
      setError(errorMessage);
    }
  };

  return (
    <div className='auth-container'>
      <form className='auth-form' onSubmit={handleSubmit}>
        <h2>Регистрация</h2>
        {error && <div className='error-message'>{error}</div>}
        <input
          type='text'
          placeholder='Имя'
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type='password'
          placeholder='Пароль'
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type='submit'>Зарегистрироваться</button>
      </form>
    </div>
  );
};

export default Register;
