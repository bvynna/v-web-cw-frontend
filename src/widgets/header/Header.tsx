import React from 'react';
import { useAuthStore } from '../../app/store/authStore';
import './Header.css';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className='header'>
      <div className='container'>
        <Link to='/' style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>🍳 Кулинарный Блог</h1>
        </Link>
        <nav>
          {isAuthenticated ? (
            <div className='user-menu'>
              <Link to='/profile'>Мой профиль</Link>
              <Link to='/favorites'>❤️ Избранное</Link>
              <span>Привет, {user?.name}!</span>
              <Link to='/create'>Создать рецепт</Link>
              <button onClick={handleLogout}>Выйти</button>
            </div>
          ) : (
            <div className='auth-links'>
              <Link to='/login'>Войти</Link>
              <Link to='/register'>Регистрация</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
