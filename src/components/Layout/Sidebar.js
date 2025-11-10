import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiFolder,
  FiCheckSquare,
  FiMessageCircle,
  FiFile,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Inicio' },
    { path: '/projects', icon: FiFolder, label: 'Proyectos' },
    { path: '/tasks', icon: FiCheckSquare, label: 'Mis Tareas' },
    { path: '/chat', icon: FiMessageCircle, label: 'Chat' },
    { path: '/files', icon: FiFile, label: 'Archivos' },
    { path: '/settings', icon: FiSettings, label: 'Configuración' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <FiFolder className="logo-icon" />
          <span className="logo-text">Colabora</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.nombre || 'Usuario'}</div>
            <div className="user-email">{user?.email || ''}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <FiLogOut className="logout-icon" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

