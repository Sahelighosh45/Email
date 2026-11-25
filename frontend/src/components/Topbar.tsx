// src/components/Topbar/Topbar.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Topbar.module.css';

interface TopbarProps {
  title: string;
  onSearch: (query: string) => void;
}

const Topbar: React.FC<TopbarProps> = ({ title, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.topbar}>
      <h1 className={styles.pageTitle}>{title}</h1>
      
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search"
          value={searchQuery}
          onChange={handleSearch}
        />
        <div className={styles.searchIcon}>
          🔍
        </div>
      </div>

      <div className={styles.userActions}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;