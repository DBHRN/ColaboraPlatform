import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiFlag, FiFolder } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = filter !== 'todas' ? { estado: filter } : {};
      const response = await api.get('/api/tasks', { params });
      setTasks(response.data.tasks || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      toast.error('Error al cargar tareas');
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentEstado) => {
    const newEstado = currentEstado === 'finalizado' ? 'por-hacer' : 'finalizado';
    
    try {
      await api.put(`/api/tasks/${taskId}`, { estado: newEstado });
      toast.success('Tarea actualizada');
      fetchTasks();
    } catch (error) {
      toast.error('Error al actualizar tarea');
    }
  };

  const getPriorityColor = (prioridad) => {
    const colors = {
      baja: '#d1fae5',
      media: '#fef3c7',
      alta: '#fed7aa',
      urgente: '#fee2e2'
    };
    return colors[prioridad] || '#e5e7eb';
  };

  const getPriorityTextColor = (prioridad) => {
    const colors = {
      baja: '#065f46',
      media: '#92400e',
      alta: '#9a3412',
      urgente: '#991b1b'
    };
    return colors[prioridad] || '#374151';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">Cargando tareas...</div>
      </MainLayout>
    );
  }

  const filteredTasks = tasks;

  return (
    <MainLayout>
      <div className="tasks-page">
        <div className="tasks-header">
          <div>
            <h1>Mis Tareas</h1>
            <p>Gestiona todas tus tareas asignadas</p>
          </div>
        </div>

        <div className="tasks-filters">
          <button
            className={`filter-btn ${filter === 'todas' ? 'active' : ''}`}
            onClick={() => setFilter('todas')}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filter === 'por-hacer' ? 'active' : ''}`}
            onClick={() => setFilter('por-hacer')}
          >
            Por Hacer
          </button>
          <button
            className={`filter-btn ${filter === 'en-progreso' ? 'active' : ''}`}
            onClick={() => setFilter('en-progreso')}
          >
            En Progreso
          </button>
          <button
            className={`filter-btn ${filter === 'finalizado' ? 'active' : ''}`}
            onClick={() => setFilter('finalizado')}
          >
            Finalizadas
          </button>
        </div>

        <div className="tasks-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task._id} className="task-card-large">
                <div className="task-card-header">
                  <div className="task-checkbox-container">
                    <input
                      type="checkbox"
                      checked={task.estado === 'finalizado'}
                      onChange={() => handleToggleTask(task._id, task.estado)}
                      className="task-checkbox"
                    />
                    <h3 className={task.estado === 'finalizado' ? 'completed' : ''}>
                      {task.titulo}
                    </h3>
                  </div>
                  <div
                    className="priority-badge-large"
                    style={{
                      background: getPriorityColor(task.prioridad),
                      color: getPriorityTextColor(task.prioridad)
                    }}
                  >
                    <FiFlag className="priority-icon" />
                    {task.prioridad}
                  </div>
                </div>

                {task.descripcion && (
                  <p className="task-card-description">{task.descripcion}</p>
                )}

                <div className="task-card-meta">
                  {task.proyecto && (
                    <Link
                      to={`/projects/${task.proyecto._id}`}
                      className="task-project-link"
                    >
                      <FiFolder className="meta-icon" />
                      {task.proyecto.nombre}
                    </Link>
                  )}
                  {task.fechaVencimiento && (
                    <div className="task-due-date">
                      <FiClock className="meta-icon" />
                      <span>
                        Vence: {format(new Date(task.fechaVencimiento), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}
                </div>

                {task.asignadoA?.length > 0 && (
                  <div className="task-assignees-large">
                    <span className="assignees-label">Asignado a:</span>
                    <div className="assignees-list">
                      {task.asignadoA.map((user, idx) => (
                        <div key={idx} className="assignee-item">
                          <div className="assignee-avatar-large">
                            {user.nombre?.charAt(0) || 'U'}
                          </div>
                          <span>{user.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-tasks">
              <FiCheckCircle className="empty-icon" />
              <h3>No hay tareas</h3>
              <p>No tienes tareas asignadas en este momento</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Tasks;

