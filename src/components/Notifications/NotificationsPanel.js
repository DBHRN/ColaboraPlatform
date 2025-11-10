import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiCheck, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './NotificationsPanel.css';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, leida: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error al marcar notificación');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      toast.error('Error al marcar notificaciones');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notificación eliminada');
    } catch (error) {
      toast.error('Error al eliminar notificación');
    }
  };

  const getNotificationIcon = (tipo) => {
    const icons = {
      tarea_asignada: '📋',
      tarea_completada: '✅',
      proyecto_invitacion: '👥',
      mensaje_nuevo: '💬',
      archivo_compartido: '📎',
      comentario_tarea: '💭',
      proyecto_actualizado: '🔄'
    };
    return icons[tipo] || '🔔';
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h2>Notificaciones</h2>
          <div className="notifications-actions">
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                title="Marcar todas como leídas"
              >
                <FiCheck /> Marcar todas
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>
        </div>

        <div className="notifications-content">
          {loading ? (
            <div className="notifications-loading">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <FiBell className="empty-icon" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.leida ? 'unread' : ''}`}
                  onClick={() => !notification.leida && markAsRead(notification._id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.tipo)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-header-item">
                      <h4>{notification.titulo}</h4>
                      {!notification.leida && <span className="unread-dot" />}
                    </div>
                    <p>{notification.mensaje}</p>
                    <div className="notification-footer">
                      <span className="notification-time">
                        {format(new Date(notification.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                      {notification.remitente && (
                        <span className="notification-sender">
                          de {notification.remitente.nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.leida && (
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification._id);
                        }}
                        title="Marcar como leída"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
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

export default NotificationsPanel;

