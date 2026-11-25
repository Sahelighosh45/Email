// src/components/Sidebar/Sidebar.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeTab: 'scheduled' | 'sent';
  onTabChange: (tab: 'scheduled' | 'sent') => void;
  scheduledCount: number;
  sentCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  scheduledCount, 
  sentCount 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCompose = () => {
    navigate('/compose');
  };

  return (
    <div className={styles.sidebar}>
      {/* User Profile Section */}
      <div className={styles.userProfile}>
        <div className={styles.userInfo}>
          {user?.avatar && (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className={styles.avatar}
            />
          )}
          <div>
            <h3 className={styles.userName}>{user?.name || 'User'}</h3>
            <p className={styles.userEmail}>{user?.email || 'user@domain.com'}</p>
          </div>
        </div>
      </div>

      {/* Compose Button */}
      <div style={{ padding: '24px' }}>
        <button className={styles.composeButton} onClick={handleCompose}>
          <div className={styles.composeButtonContent}>
            <span>✏️</span>
            <span>Compose</span>
          </div>
        </button>
      </div>

      {/* Core Section */}
      <div className={styles.navSection}>
        <h4 className={styles.sectionTitle}>CORE</h4>
        
        <div 
          className={`${styles.navItem} ${activeTab === 'scheduled' ? styles.active : ''}`}
          onClick={() => onTabChange('scheduled')}
        >
          <div className={styles.navItemContent}>
            <span>⏰</span>
            <span>Scheduled</span>
          </div>
          <div className={styles.navItemCount}>
            {scheduledCount}
          </div>
        </div>

        <div 
          className={`${styles.navItem} ${activeTab === 'sent' ? styles.active : ''}`}
          onClick={() => onTabChange('sent')}
        >
          <div className={styles.navItemContent}>
            <span>📤</span>
            <span>Sent</span>
          </div>
          <div className={styles.navItemCount}>
            {sentCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;