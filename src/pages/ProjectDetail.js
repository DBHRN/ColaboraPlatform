import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiPlus, FiFile, FiMessageCircle, FiUsers, FiCalendar, FiSearch, FiUserPlus, FiSend, FiPaperclip, FiUpload, FiDownload, FiTrash2, FiEdit2 } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { getFileUrl } from '../utils/fileUtils';
import { toast } from 'react-toastify';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tablero');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectMessages, setProjectMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTask, setNewTask] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    asignadoA: []
  });

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'archivos' && project) {
      fetchProjectFiles();
    }
    if (activeTab === 'discusion' && project) {
      fetchProjectMessages();
    }
  }, [activeTab, project]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/tasks?proyecto=${id}`)
      ]);

      setProject(projectRes.data.project);
      setTasks(tasksRes.data.tasks || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proyecto:', error);
      toast.error('Error al cargar proyecto');
      setLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    try {
      const response = await api.get(`/api/files?proyecto=${id}`);
      setProjectFiles(response.data.files || []);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast.error('Error al cargar archivos');
    }
  };

  const fetchProjectMessages = async () => {
    try {
      const response = await api.get(`/api/chat/${id}/general`);
      setProjectMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/api/chat', {
        contenido: newMessage,
        proyecto: id,
        canal: 'general'
      });

      setProjectMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
      fetchProjectMessages();
    } catch (error) {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('proyecto', id);

    try {
      await api.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Archivo subido exitosamente');
      fetchProjectFiles();
    } catch (error) {
      toast.error('Error al subir archivo');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await api.delete(`/api/files/${fileId}`);
      toast.success('Archivo eliminado exitosamente');
      fetchProjectFiles();
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/api/users?search=${query}`);
      // Filtrar usuarios que ya son miembros
      const memberIds = project?.miembros?.map(m => m.usuario._id || m.usuario) || [];
      const filtered = response.data.users.filter(
        user => !memberIds.some(id => id.toString() === user._id.toString())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      toast.error('Error al buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await api.post(`/api/projects/${id}/members`, {
        usuarioId: userId,
        rol: 'miembro'
      });

      toast.success('Miembro agregado exitosamente');
      setShowAddMemberModal(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al agregar miembro');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', {
        ...newTask,
        proyecto: id
      });

      toast.success('Tarea creada exitosamente');
      setShowTaskModal(false);
      setNewTask({ titulo: '', descripcion: '', prioridad: 'media', asignadoA: [] });
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear tarea');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newEstado = destination.droppableId;

    try {
      await api.put(`/api/tasks/${draggableId}`, { estado: newEstado });
      
      // Actualizar estado local
      const updatedTasks = tasks.map(task => {
        if (task._id === draggableId) {
          return { ...task, estado: newEstado };
        }
        return task;
      });
      setTasks(updatedTasks);
      
      // Actualizar progreso del proyecto
      fetchProjectData();
    } catch (error) {
      toast.error('Error al actualizar tarea');
    }
  };

  const getTasksByEstado = (estado) => {
    return tasks.filter(task => task.estado === estado);
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'por-hacer': 'Por Hacer',
      'en-progreso': 'En Progreso',
      'finalizado': 'Finalizado'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">Cargando proyecto...</div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="error-container">Proyecto no encontrado</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="project-detail">
        <div className="project-header">
          <div>
            <h1>{project.nombre}</h1>
            <p>{project.descripcion || 'Sin descripción'}</p>
          </div>
          <div className="project-header-actions">
            <span className={`project-status-large ${project.estado}`}>
              {project.estado}
            </span>
          </div>
        </div>

        <div className="project-tabs">
          <button
            className={`tab ${activeTab === 'resumen' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            Resumen
          </button>
          <button
            className={`tab ${activeTab === 'tablero' ? 'active' : ''}`}
            onClick={() => setActiveTab('tablero')}
          >
            Tablero de Tareas
          </button>
          <button
            className={`tab ${activeTab === 'archivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('archivos')}
          >
            Archivos
          </button>
          <button
            className={`tab ${activeTab === 'discusion' ? 'active' : ''}`}
            onClick={() => setActiveTab('discusion')}
          >
            Discusión
          </button>
        </div>

        <div className="project-content">
          {activeTab === 'resumen' && (
            <div className="tab-content">
              <div className="summary-grid">
                <div className="summary-card">
                  <h3>Progreso del Proyecto</h3>
                  <div className="progress-large">
                    <div className="progress-bar-large">
                      <div
                        className="progress-fill-large"
                        style={{ width: `${project.progreso}%` }}
                      />
                    </div>
                    <span className="progress-percentage-large">{project.progreso}%</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="card-header-with-action">
                    <h3>Miembros del Equipo</h3>
                    <button
                      className="btn-icon-small"
                      onClick={() => setShowAddMemberModal(true)}
                      title="Agregar miembro"
                    >
                      <FiUserPlus />
                    </button>
                  </div>
                  <div className="members-list">
                    {project.miembros?.map((miembro, index) => (
                      <div key={index} className="member-item">
                        <div className="member-avatar">
                          {miembro.usuario?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="member-info">
                          <div className="member-name">{miembro.usuario?.nombre || 'Usuario'}</div>
                          <div className="member-role">{miembro.rol}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="summary-card">
                  <h3>Información del Proyecto</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <FiCalendar className="info-icon" />
                      <span>Fecha de inicio: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <FiUsers className="info-icon" />
                      <span>Miembros: {project.miembros?.length || 0}</span>
                    </div>
                    <div className="info-item">
                      <FiFile className="info-icon" />
                      <span>Tareas: {tasks.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tablero' && (
            <div className="tab-content">
              <div className="kanban-header">
                <h2>Tablero de Tareas</h2>
                <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
                  <FiPlus className="btn-icon" />
                  Nueva Tarea
                </button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                  {['por-hacer', 'en-progreso', 'finalizado'].map((estado) => (
                    <Droppable key={estado} droppableId={estado}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`kanban-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        >
                          <div className="column-header">
                            <h3>{getEstadoLabel(estado)}</h3>
                            <span className="task-count">{getTasksByEstado(estado).length}</span>
                          </div>
                          <div className="column-content">
                            {getTasksByEstado(estado).map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                                  >
                                    <div className="task-card-header">
                                      <h4>{task.titulo}</h4>
                                      <span className={`priority-badge ${task.prioridad}`}>
                                        {task.prioridad}
                                      </span>
                                    </div>
                                    {task.descripcion && (
                                      <p className="task-description">{task.descripcion}</p>
                                    )}
                                    {task.asignadoA?.length > 0 && (
                                      <div className="task-assignees">
                                        {task.asignadoA.map((user, idx) => (
                                          <div key={idx} className="assignee-avatar">
                                            {user.nombre?.charAt(0) || 'U'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              </DragDropContext>
            </div>
          )}

          {activeTab === 'archivos' && (
            <div className="tab-content">
              <div className="files-header-section">
                <h2>Archivos del Proyecto</h2>
                <label className="btn-primary file-upload-label-project">
                  <FiUpload className="btn-icon" />
                  Subir Archivo
                  <input
                    type="file"
                    onChange={handleUploadFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div className="project-files-list">
                {projectFiles.length > 0 ? (
                  <table className="files-table-project">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Propietario</th>
                        <th>Tamaño</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectFiles.map((file) => (
                        <tr key={file._id}>
                          <td>
                            <div className="file-name-cell-project">
                              <FiFile className="file-icon-project" />
                              <span>{file.nombre}</span>
                            </div>
                          </td>
                          <td>{new Date(file.updatedAt).toLocaleDateString()}</td>
                          <td>{file.subidoPor?.nombre || 'Usuario'}</td>
                          <td>{file.esCarpeta ? '-' : `${(file.tamaño / 1024).toFixed(2)} KB`}</td>
                          <td>
                            <div className="file-actions-project">
                              {!file.esCarpeta && (
                                <>
                                  <button
                                    className="action-btn-project"
                                    onClick={() => window.open(getFileUrl(file.ruta), '_blank')}
                                    title="Ver"
                                  >
                                    <FiFile />
                                  </button>
                                  <button
                                    className="action-btn-project"
                                    onClick={() => window.open(getFileUrl(file.ruta), '_blank')}
                                    title="Descargar"
                                  >
                                    <FiDownload />
                                  </button>
                                </>
                              )}
                              <button
                                className="action-btn-project delete"
                                onClick={() => handleDeleteFile(file._id)}
                                title="Eliminar"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-files-project">
                    <FiFile className="empty-icon-project" />
                    <p>No hay archivos en este proyecto</p>
                    <span>Sube tu primer archivo para comenzar</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'discusion' && (
            <div className="tab-content discussion-content">
              <h2>Discusión del Proyecto</h2>
              <div className="discussion-messages">
                {projectMessages.length > 0 ? (
                  projectMessages.map((message) => (
                    <div key={message._id} className="discussion-message">
                      <div className="message-avatar-discussion">
                        {message.remitente?.nombre?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="message-content-discussion">
                        <div className="message-header-discussion">
                          <span className="message-author-discussion">{message.remitente?.nombre || 'Usuario'}</span>
                          <span className="message-time-discussion">
                            {new Date(message.createdAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div className="message-text-discussion">{message.contenido}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-discussion">
                    <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
                  </div>
                )}
              </div>
              <form className="discussion-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Escribir un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="discussion-input"
                />
                <button type="submit" className="send-btn-discussion" disabled={!newMessage.trim()}>
                  <FiSend />
                </button>
              </form>
            </div>
          )}
        </div>

        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Crear Nueva Tarea</h2>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    value={newTask.titulo}
                    onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={newTask.descripcion}
                    onChange={(e) => setNewTask({ ...newTask, descripcion: e.target.value })}
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    value={newTask.prioridad}
                    onChange={(e) => setNewTask({ ...newTask, prioridad: e.target.value })}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Crear Tarea
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddMemberModal && (
          <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Agregar Miembro al Proyecto</h2>
              <div className="search-users-container">
                <div className="search-input-wrapper">
                  <FiSearch className="search-icon-input" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="search-users-input"
                  />
                </div>
                {searching && <div className="search-loading">Buscando...</div>}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.map((user) => (
                      <div key={user._id} className="search-result-item">
                        <div className="result-user-info">
                          <div className="result-avatar">
                            {user.nombre?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="result-name">{user.nombre}</div>
                            <div className="result-email">{user.email}</div>
                          </div>
                        </div>
                        <button
                          className="btn-add-member"
                          onClick={() => handleAddMember(user._id)}
                        >
                          <FiUserPlus /> Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && !searching && searchResults.length === 0 && (
                  <div className="no-results">No se encontraron usuarios</div>
                )}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;

