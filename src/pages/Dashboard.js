import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiFolder, FiActivity } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import './Dashboard.css';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Obtener notificaciones recientes como actividad
      const notificationsRes = await api.get('/api/notifications?limit=10');
      const notifications = notificationsRes.data.notifications || [];
      
      // Obtener proyectos del usuario para obtener mensajes
      const projectsRes = await api.get('/api/projects');
      const projects = projectsRes.data.projects || [];
      
      // Combinar y formatear actividad
      const activities = [];
      
      // Agregar notificaciones como actividad
      notifications.forEach(notif => {
        activities.push({
          id: notif._id,
          usuario: notif.remitente?.nombre || 'Sistema',
          accion: notif.titulo.toLowerCase(),
          item: notif.mensaje,
          tiempo: formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es }),
          createdAt: notif.createdAt
        });
      });
      
      // Obtener mensajes recientes de los proyectos
      for (const project of projects.slice(0, 3)) {
        try {
          const messagesRes = await api.get(`/api/chat/${project._id}/general?limit=3`);
          const messages = messagesRes.data.messages || [];
          
          messages.forEach(msg => {
            activities.push({
              id: msg._id,
              usuario: msg.remitente?.nombre || 'Usuario',
              accion: 'envió un mensaje en',
              item: project.nombre,
              tiempo: formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es }),
              createdAt: msg.createdAt
            });
          });
        } catch (error) {
          // Ignorar errores de proyectos individuales
        }
      }
      
      // Ordenar por fecha y tomar los más recientes
      activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActivity(activities.slice(0, 10));
    } catch (error) {
      console.error('Error al cargar actividad:', error);
      setActivity([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/api/tasks?limit=4'),
        api.get('/api/projects?limit=3')
      ]);

      setTasks(tasksRes.data.tasks || []);
      setProjects(projectsRes.data.projects || []);
      
      // Obtener actividad reciente real
      await fetchRecentActivity();

      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">Cargando...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Bienvenido de nuevo</h1>
          <p>Aquí está un resumen de tu actividad</p>
        </div>

        <div className="dashboard-grid">
          {/* Widget: Mis Tareas Pendientes */}
          <div className="dashboard-widget">
            <div className="widget-header">
              <div className="widget-title">
                <FiCheckCircle className="widget-icon" />
                <h2>Mis Tareas Pendientes</h2>
              </div>
              <Link to="/tasks" className="widget-link">Ver todas</Link>
            </div>
            <div className="widget-content">
              {tasks.length > 0 ? (
                <ul className="task-list">
                  {tasks.map((task) => (
                    <li key={task._id} className="task-item">
                      <input
                        type="checkbox"
                        checked={task.estado === 'finalizado'}
                        readOnly
                      />
                      <div className="task-info">
                        <span className="task-title">{task.titulo}</span>
                        {task.fechaVencimiento && (
                          <span className="task-date">
                            <FiClock className="date-icon" />
                            {format(new Date(task.fechaVencimiento), 'dd MMM', { locale: es })}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">No hay tareas pendientes</p>
              )}
            </div>
          </div>

          {/* Widget: Proyectos Recientes */}
          <div className="dashboard-widget">
            <div className="widget-header">
              <div className="widget-title">
                <FiFolder className="widget-icon" />
                <h2>Proyectos Recientes</h2>
              </div>
              <Link to="/projects" className="widget-link">Ver todos</Link>
            </div>
            <div className="widget-content">
              {projects.length > 0 ? (
                <div className="project-cards">
                  {projects.map((project) => (
                    <Link
                      key={project._id}
                      to={`/projects/${project._id}`}
                      className="project-card"
                    >
                      <div className="project-header">
                        <h3>{project.nombre}</h3>
                        <span className={`project-status ${project.estado}`}>
                          {project.estado}
                        </span>
                      </div>
                      <p className="project-description">{project.descripcion || 'Sin descripción'}</p>
                      <div className="project-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${project.progreso}%` }}
                          />
                        </div>
                        <span className="progress-text">{project.progreso}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No hay proyectos recientes</p>
              )}
            </div>
          </div>

          {/* Widget: Actividad Reciente del Equipo */}
          <div className="dashboard-widget full-width">
            <div className="widget-header">
              <div className="widget-title">
                <FiActivity className="widget-icon" />
                <h2>Actividad Reciente del Equipo</h2>
              </div>
            </div>
            <div className="widget-content">
              <div className="activity-feed">
                {activity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className="activity-avatar">
                      {item.usuario.charAt(0)}
                    </div>
                    <div className="activity-content">
                      <p>
                        <strong>{item.usuario}</strong> {item.accion}{' '}
                        <span className="activity-item-name">{item.item}</span>
                      </p>
                      <span className="activity-time">{item.tiempo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

