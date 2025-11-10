import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiBell, FiLogOut, FiSettings, FiUser, FiMoon, FiSun } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import api from '../../utils/api';
import './Header.css';

const Header = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications?leida=false&limit=1');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <>
      <header className="header">
        <form className="search-bar" onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar proyectos, tareas, archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        <div className="header-actions">
          <button
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <FiSun className="icon" /> : <FiMoon className="icon" />}
          </button>
          <button
            className="icon-btn notification-btn"
            onClick={() => setShowNotifications(true)}
          >
            <FiBell className="icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          <div className="user-menu" ref={userMenuRef}>
            <div className="user-menu-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar-header">
                {user?.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info-header">
                <span className="user-name-header">{user?.nombre || 'Usuario'}</span>
                <span className="user-org-header">{user?.organizacion || 'Organización'}</span>
              </div>
            </div>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="dropdown-item" onClick={() => { navigate('/settings'); setShowUserMenu(false); }}>
                  <FiSettings className="dropdown-icon" />
                  <span>Configuración</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  <FiLogOut className="dropdown-icon" />
                  <span>Cerrar Sesión</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }}
      />
    </>
  );
};

export default Header;

