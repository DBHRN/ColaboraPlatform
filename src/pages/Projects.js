import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiFolder, FiUsers, FiCalendar } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    nombre: '',
    descripcion: '',
    etiquetas: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      toast.error('Error al cargar proyectos');
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const etiquetas = newProject.etiquetas
        ? newProject.etiquetas.split(',').map(t => t.trim())
        : [];

      const response = await api.post('/api/projects', {
        nombre: newProject.nombre,
        descripcion: newProject.descripcion,
        etiquetas
      });

      toast.success('Proyecto creado exitosamente');
      setShowModal(false);
      setNewProject({ nombre: '', descripcion: '', etiquetas: '' });
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear proyecto');
    }
  };

  const filteredProjects = projects.filter(project =>
    project.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">Cargando proyectos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="projects-page">
        <div className="projects-header">
          <div>
            <h1>Proyectos</h1>
            <p>Gestiona todos tus proyectos colaborativos</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus className="btn-icon" />
            Nuevo Proyecto
          </button>
        </div>

        <div className="projects-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="projects-grid">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <Link
                key={project._id}
                to={`/projects/${project._id}`}
                className="project-card-link"
              >
                <div className="project-card-large">
                  <div className="project-card-header">
                    <div className="project-icon">
                      <FiFolder />
                    </div>
                    <span className={`project-status-badge ${project.estado}`}>
                      {project.estado}
                    </span>
                  </div>
                  <h3>{project.nombre}</h3>
                  <p className="project-card-description">
                    {project.descripcion || 'Sin descripción'}
                  </p>
                  <div className="project-card-meta">
                    <div className="meta-item">
                      <FiUsers className="meta-icon" />
                      <span>{project.miembros?.length || 0} miembros</span>
                    </div>
                    <div className="meta-item">
                      <FiCalendar className="meta-icon" />
                      <span>
                        {format(new Date(project.createdAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="project-card-progress">
                    <div className="progress-info">
                      <span>Progreso</span>
                      <span className="progress-percentage">{project.progreso}%</span>
                    </div>
                    <div className="progress-bar-large">
                      <div
                        className="progress-fill-large"
                        style={{ width: `${project.progreso}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-projects">
              <FiFolder className="empty-icon" />
              <h3>No hay proyectos</h3>
              <p>Crea tu primer proyecto para comenzar</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <FiPlus className="btn-icon" />
                Crear Proyecto
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Crear Nuevo Proyecto</h2>
              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label>Nombre del Proyecto *</label>
                  <input
                    type="text"
                    value={newProject.nombre}
                    onChange={(e) => setNewProject({ ...newProject, nombre: e.target.value })}
                    placeholder="Ej: Desarrollo Web"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={newProject.descripcion}
                    onChange={(e) => setNewProject({ ...newProject, descripcion: e.target.value })}
                    placeholder="Describe el propósito del proyecto..."
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Etiquetas (separadas por comas)</label>
                  <input
                    type="text"
                    value={newProject.etiquetas}
                    onChange={(e) => setNewProject({ ...newProject, etiquetas: e.target.value })}
                    placeholder="web, desarrollo, frontend"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Crear Proyecto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Projects;

