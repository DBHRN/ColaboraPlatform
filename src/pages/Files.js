import React, { useState, useEffect } from 'react';
import { FiUpload, FiFolderPlus, FiFile, FiFolder, FiMoreVertical, FiDownload, FiTrash2, FiEdit2, FiEye } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { getFileUrl } from '../utils/fileUtils';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './Files.css';

const Files = () => {
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editFileName, setEditFileName] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchFiles();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const params = selectedProject ? { proyecto: selectedProject } : {};
      const response = await api.get('/api/files', { params });
      setFiles(response.data.files || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
      toast.error('Error al cargar archivos');
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);
    if (selectedProject) {
      formData.append('proyecto', selectedProject);
    }

    try {
      await api.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Archivo subido exitosamente');
      fetchFiles();
    } catch (error) {
      toast.error('Error al subir archivo');
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post('/api/files/folder', {
        nombre: newFolderName,
        proyecto: selectedProject || undefined
      });

      toast.success('Carpeta creada exitosamente');
      setShowFolderModal(false);
      setNewFolderName('');
      fetchFiles();
    } catch (error) {
      toast.error('Error al crear carpeta');
    }
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setEditFileName(file.nombre);
    setShowEditModal(true);
  };

  const handleUpdateFile = async (e) => {
    e.preventDefault();
    if (!editFileName.trim()) return;

    try {
      await api.put(`/api/files/${editingFile._id}`, {
        nombre: editFileName
      });

      toast.success('Archivo actualizado exitosamente');
      setShowEditModal(false);
      setEditingFile(null);
      setEditFileName('');
      fetchFiles();
    } catch (error) {
      toast.error('Error al actualizar archivo');
    }
  };

  const handleViewFile = async (file) => {
    try {
      const fileUrl = getFileUrl(file.ruta);
      window.open(fileUrl, '_blank');
    } catch (error) {
      toast.error('Error al abrir archivo');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      await api.delete(`/api/files/${fileId}`);
      toast.success('Archivo eliminado exitosamente');
      fetchFiles();
    } catch (error) {
      toast.error('Error al eliminar archivo');
    }
  };

  const getFileIcon = (file) => {
    if (file.esCarpeta) {
      return <FiFolder className="file-icon folder" />;
    }
    return <FiFile className="file-icon" />;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="loading-container">Cargando archivos...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="files-page">
        <div className="files-header">
          <div>
            <h1>Archivos</h1>
            <p>Gestiona todos tus archivos y documentos</p>
          </div>
          <div className="files-actions">
            <label className="btn-primary file-upload-label">
              <FiUpload className="btn-icon" />
              Subir Archivo
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              className="btn-primary"
              onClick={() => setShowFolderModal(true)}
            >
              <FiFolderPlus className="btn-icon" />
              Crear Carpeta
            </button>
          </div>
        </div>

        <div className="files-filters">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="project-filter"
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="files-table-container">
          <table className="files-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha de modificación</th>
                <th>Propietario</th>
                <th>Tamaño</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {files.length > 0 ? (
                files.map((file) => (
                  <tr key={file._id}>
                    <td>
                      <div className="file-name-cell">
                        {getFileIcon(file)}
                        <span>{file.nombre}</span>
                      </div>
                    </td>
                    <td>
                      {format(new Date(file.updatedAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </td>
                    <td>
                      <div className="file-owner">
                        <div className="owner-avatar">
                          {file.subidoPor?.nombre?.charAt(0) || 'U'}
                        </div>
                        <span>{file.subidoPor?.nombre || 'Usuario'}</span>
                      </div>
                    </td>
                    <td>
                      {file.esCarpeta ? '-' : `${(file.tamaño / 1024).toFixed(2)} KB`}
                    </td>
                    <td>
                      <div className="file-actions">
                        {!file.esCarpeta && (
                          <>
                            <button
                              className="action-btn"
                              onClick={() => handleViewFile(file)}
                              title="Ver"
                            >
                              <FiEye />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => window.open(getFileUrl(file.ruta), '_blank')}
                              title="Descargar"
                            >
                              <FiDownload />
                            </button>
                          </>
                        )}
                        <button
                          className="action-btn"
                          onClick={() => handleEditFile(file)}
                          title="Editar"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteFile(file._id)}
                          title="Eliminar"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-files">
                    <div className="empty-state-files">
                      <FiFile className="empty-icon" />
                      <p>No hay archivos</p>
                      <span>Sube tu primer archivo para comenzar</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showFolderModal && (
          <div className="modal-overlay" onClick={() => setShowFolderModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Crear Nueva Carpeta</h2>
              <form onSubmit={handleCreateFolder}>
                <div className="form-group">
                  <label>Nombre de la Carpeta *</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Documentos"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowFolderModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Crear Carpeta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && editingFile && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Editar {editingFile.esCarpeta ? 'Carpeta' : 'Archivo'}</h2>
              <form onSubmit={handleUpdateFile}>
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={editFileName}
                    onChange={(e) => setEditFileName(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFile(null);
                      setEditFileName('');
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Guardar
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

export default Files;

