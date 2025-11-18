import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './app/store/authStore';
import Header from './widgets/header/Header';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Recipes from './pages/Recipes/Recipes';
import CreateRecipe from './pages/CreateRecipe/CreateRecipe';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return <div className='loading'>Загрузка...</div>;
  }

  return (
    <Router>
      <div className='App'>
        <Header />
        <Routes>
          <Route path='/' element={<Recipes />} />
          <Route path='/login' element={!isAuthenticated ? <Login /> : <Navigate to='/' />} />
          <Route path='/register' element={!isAuthenticated ? <Register /> : <Navigate to='/' />} />
          <Route
            path='/create'
            element={isAuthenticated ? <CreateRecipe /> : <Navigate to='/login' />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
