import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Profile/SubscribersList.css'; // Используем те же стили

interface LikedUser {
  id: number;
  name: string;
  avatarUrl?: string;
  likedAt: string;
}

interface LikesListProps {
  recipeId: number;
  onClose: () => void;
}

const LikesList: React.FC<LikesListProps> = ({ recipeId, onClose }) => {
  const [likedUsers, setLikedUsers] = useState<LikedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLikes();
  }, [recipeId]);

  const fetchLikes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/favorites/recipes/${recipeId}/likes`,
      );
      setLikedUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (userId: number) => {
    onClose();
    navigate(`/user/${userId}`);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Лайки</h2>
          <button className='close-btn' onClick={onClose}>
            ✕
          </button>
        </div>
        <div className='modal-body'>
          {isLoading ? (
            <div className='loading'>Загрузка...</div>
          ) : likedUsers.length === 0 ? (
            <p className='no-data'>Пока никто не лайкнул</p>
          ) : (
            <div className='users-list'>
              {likedUsers.map(user => (
                <div key={user.id} className='user-item' onClick={() => handleUserClick(user.id)}>
                  <div className='user-avatar'>
                    {user.avatarUrl ? (
                      <img src={`http://localhost:5000${user.avatarUrl}`} alt={user.name} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className='user-info'>
                    <p className='user-name'>{user.name}</p>
                    <p className='subscribed-date'>
                      Лайкнул {new Date(user.likedAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesList;
