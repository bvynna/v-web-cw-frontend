import React, { useState } from 'react';
import { useAuthStore } from '../../app/store/authStore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка входа';
      setError(errorMessage);
    }
  };

  return (
    <div className='auth-container'>
      <form className='auth-form' onSubmit={handleSubmit}>
        <h2>Вход</h2>
        {error && <div className='error-message'>{error}</div>}
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
        <button type='submit'>Войти</button>
      </form>
    </div>
  );
};

export default Login;
