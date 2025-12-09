import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './SubscribersList.css';

interface Subscriber {
  id: number;
  name: string;
  avatarUrl?: string;
  subscribedAt: string;
}

interface SubscribersListProps {
  userId: number;
  onClose: () => void;
}

const SubscribersList: React.FC<SubscribersListProps> = ({ userId, onClose }) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscribers();
  }, [userId]);

  const fetchSubscribers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/users/${userId}/subscribers`);
      setSubscribers(response.data);
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (subscriberId: number) => {
    onClose();
    navigate(`/user/${subscriberId}`);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Подписчики</h2>
          <button className='close-btn' onClick={onClose}>
            ✕
          </button>
        </div>
        <div className='modal-body'>
          {isLoading ? (
            <div className='loading'>Загрузка...</div>
          ) : subscribers.length === 0 ? (
            <p className='no-data'>Пока нет подписчиков</p>
          ) : (
            <div className='users-list'>
              {subscribers.map(subscriber => (
                <div
                  key={subscriber.id}
                  className='user-item'
                  onClick={() => handleUserClick(subscriber.id)}
                >
                  <div className='user-avatar'>
                    {subscriber.avatarUrl ? (
                      <img
                        src={`http://localhost:5000${subscriber.avatarUrl}`}
                        alt={subscriber.name}
                      />
                    ) : (
                      subscriber.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className='user-info'>
                    <p className='user-name'>{subscriber.name}</p>
                    <p className='subscribed-date'>
                      Подписан с {new Date(subscriber.subscribedAt).toLocaleDateString('ru-RU')}
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

export default SubscribersList;
