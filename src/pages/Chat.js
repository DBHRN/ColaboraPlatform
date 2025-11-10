import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiSend, FiPaperclip, FiFile, FiEdit2, FiTrash2, FiUser, FiMessageCircle, FiSearch } from 'react-icons/fi';
import { io } from 'socket.io-client';
import MainLayout from '../components/Layout/MainLayout';
import EmojiPicker from '../components/EmojiPicker/EmojiPicker';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import './Chat.css';

const Chat = () => {
  const { proyectoId, canal } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(proyectoId || null);
  const [selectedChannel, setSelectedChannel] = useState(canal || 'general');
  const [chatMode, setChatMode] = useState('project'); // 'project' o 'private'
  const [privateConversations, setPrivateConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchUsersQuery, setSearchUsersQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
    fetchUsers();
    if (chatMode === 'private') {
      fetchPrivateConversations();
    }
    
    // Conectar a Socket.io
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [chatMode]);

  useEffect(() => {
    if (chatMode === 'project' && selectedProject && socket) {
      socket.emit('join-room', selectedProject);
      fetchMessages();
    } else if (chatMode === 'private' && selectedUser) {
      fetchPrivateMessages();
    }
  }, [selectedProject, selectedChannel, socket, chatMode, selectedUser]);

  useEffect(() => {
    if (socket) {
      socket.on('receive-message', (data) => {
        if (chatMode === 'project') {
          setMessages(prev => [...prev, data.message]);
        } else {
          setPrivateMessages(prev => [...prev, data.message]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('receive-message');
      }
    };
  }, [socket, chatMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, privateMessages]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data.projects || []);
      if (response.data.projects?.length > 0 && !selectedProject) {
        setSelectedProject(response.data.projects[0]._id);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedProject) return;

    try {
      const response = await api.get(`/api/chat/${selectedProject}/${selectedChannel}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const fetchPrivateConversations = async () => {
    try {
      const response = await api.get('/api/messages/conversations');
      setPrivateConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const fetchPrivateMessages = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.get(`/api/messages/private/${selectedUser}`);
      setPrivateMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error al cargar mensajes privados:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (chatMode === 'project') {
      if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedProject) return;

      try {
        const formData = new FormData();
        formData.append('contenido', newMessage);
        formData.append('proyecto', selectedProject);
        formData.append('canal', selectedChannel);
        
        selectedFiles.forEach((file) => {
          formData.append('archivos', file);
        });

        const response = await api.post('/api/chat', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (socket) {
          socket.emit('send-message', {
            roomId: selectedProject,
            message: response.data.message
          });
        }

        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        setSelectedFiles([]);
      } catch (error) {
        toast.error('Error al enviar mensaje');
      }
    } else if (chatMode === 'private') {
      if (!newMessage.trim() || !selectedUser) return;

      try {
        const response = await api.post('/api/messages/private', {
          contenido: newMessage,
          destinatario: selectedUser
        });

        setPrivateMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        fetchPrivateConversations();
      } catch (error) {
        toast.error('Error al enviar mensaje');
      }
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editContent.trim()) return;

    try {
      const endpoint = chatMode === 'project' 
        ? `/api/chat/${messageId}`
        : `/api/messages/${messageId}`;
      
      const response = await api.put(endpoint, {
        contenido: editContent
      });

      if (chatMode === 'project') {
        setMessages(prev => prev.map(m => 
          m._id === messageId ? response.data.message : m
        ));
      } else {
        setPrivateMessages(prev => prev.map(m => 
          m._id === messageId ? response.data.message : m
        ));
      }

      setEditingMessage(null);
      setEditContent('');
      toast.success('Mensaje editado');
    } catch (error) {
      toast.error('Error al editar mensaje');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('¿Estás seguro de eliminar este mensaje?')) return;

    try {
      const endpoint = chatMode === 'project' 
        ? `/api/chat/${messageId}`
        : `/api/messages/${messageId}`;
      
      await api.delete(endpoint);

      if (chatMode === 'project') {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      } else {
        setPrivateMessages(prev => prev.filter(m => m._id !== messageId));
      }

      toast.success('Mensaje eliminado');
    } catch (error) {
      toast.error('Error al eliminar mensaje');
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (editingMessage) {
      setEditContent(prev => prev + emoji);
    } else {
      setNewMessage(prev => prev + emoji);
    }
  };

  const startEditMessage = (message) => {
    setEditingMessage(message._id);
    setEditContent(message.contenido);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startPrivateChat = (userId) => {
    setSelectedUser(userId);
    setChatMode('private');
  };

  const displayMessages = chatMode === 'project' ? messages : privateMessages;
  const otherUser = chatMode === 'private' && selectedUser 
    ? users.find(u => u._id === selectedUser)
    : null;

  return (
    <MainLayout>
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="chat-mode-toggle">
            <button
              className={`mode-btn ${chatMode === 'project' ? 'active' : ''}`}
              onClick={() => {
                setChatMode('project');
                setSelectedUser(null);
              }}
            >
              <FiMessageCircle /> Proyectos
            </button>
            <button
              className={`mode-btn ${chatMode === 'private' ? 'active' : ''}`}
              onClick={() => {
                setChatMode('private');
                setSelectedProject(null);
                fetchPrivateConversations();
              }}
            >
              <FiUser /> Privados
            </button>
          </div>

          {chatMode === 'project' ? (
            <>
              <div className="chat-sidebar-header">
                <h2>Proyectos</h2>
              </div>
              <div className="projects-list">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className={`project-channel ${selectedProject === project._id ? 'active' : ''}`}
                    onClick={() => setSelectedProject(project._id)}
                  >
                    <div className="channel-icon">📁</div>
                    <div className="channel-info">
                      <div className="channel-name">{project.nombre}</div>
                      <div className="channel-meta">{project.miembros?.length || 0} miembros</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="chat-sidebar-header">
                <h2>Conversaciones</h2>
              </div>
              <div className="users-search">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchUsersQuery}
                  onChange={(e) => setSearchUsersQuery(e.target.value)}
                />
              </div>
              <div className="conversations-list">
                {searchUsersQuery ? (
                  users
                    .filter(u => 
                      u._id !== user?.id && 
                      (u.nombre.toLowerCase().includes(searchUsersQuery.toLowerCase()) ||
                       u.email.toLowerCase().includes(searchUsersQuery.toLowerCase()))
                    )
                    .map((userItem) => (
                      <div
                        key={userItem._id}
                        className={`conversation-item ${selectedUser === userItem._id ? 'active' : ''}`}
                        onClick={() => startPrivateChat(userItem._id)}
                      >
                        <div className="conversation-avatar">
                          {userItem.nombre?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="conversation-info">
                          <div className="conversation-name">{userItem.nombre}</div>
                          <div className="conversation-email">{userItem.email}</div>
                        </div>
                      </div>
                    ))
                ) : (
                  <>
                    {privateConversations.map((conv) => (
                      <div
                        key={conv.usuario._id}
                        className={`conversation-item ${selectedUser === conv.usuario._id ? 'active' : ''}`}
                        onClick={() => startPrivateChat(conv.usuario._id)}
                      >
                        <div className="conversation-avatar">
                          {conv.usuario.nombre?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="conversation-info">
                          <div className="conversation-name">{conv.usuario.nombre}</div>
                          <div className="conversation-preview">
                            {conv.ultimoMensaje?.contenido || 'Sin mensajes'}
                          </div>
                        </div>
                        {conv.noLeidos > 0 && (
                          <div className="unread-badge">{conv.noLeidos}</div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="chat-main">
          {(chatMode === 'project' && selectedProject) || (chatMode === 'private' && selectedUser) ? (
            <>
              <div className="chat-header">
                <div>
                  <h2>
                    {chatMode === 'project' 
                      ? projects.find(p => p._id === selectedProject)?.nombre || 'Chat'
                      : otherUser?.nombre || 'Chat Privado'}
                  </h2>
                  <p className="channel-subtitle">
                    {chatMode === 'project' 
                      ? `Canal: ${selectedChannel}`
                      : `Conversación privada con ${otherUser?.email || ''}`}
                  </p>
                </div>
              </div>

              <div className="messages-container">
                {displayMessages.length > 0 ? (
                  displayMessages.map((message) => (
                    <div
                      key={message._id}
                      className={`message ${message.remitente._id === user?.id ? 'own' : ''}`}
                    >
                      <div className="message-avatar">
                        {message.remitente.nombre?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="message-content">
                        <div className="message-header">
                          <span className="message-author">{message.remitente.nombre}</span>
                          <span className="message-time">
                            {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
                            {message.editado && <span className="edited-badge"> (editado)</span>}
                          </span>
                        </div>
                        {editingMessage === message._id ? (
                          <div className="edit-message-form">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="edit-input"
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button
                                className="edit-save-btn"
                                onClick={() => handleEditMessage(message._id)}
                              >
                                Guardar
                              </button>
                              <button
                                className="edit-cancel-btn"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="message-text">{message.contenido}</div>
                            {message.archivosAdjuntos && message.archivosAdjuntos.length > 0 && (
                              <div className="message-attachments">
                                {message.archivosAdjuntos.map((archivo, idx) => (
                                  <a
                                    key={idx}
                                    href={`http://localhost:5000${archivo.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="attachment-link"
                                  >
                                    <FiFile className="attachment-icon" />
                                    <span>{archivo.nombre}</span>
                                    {archivo.tipo?.startsWith('image/') && (
                                      <img
                                        src={`http://localhost:5000${archivo.url}`}
                                        alt={archivo.nombre}
                                        className="attachment-preview"
                                      />
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}
                            {message.remitente._id === user?.id && (
                              <div className="message-actions">
                                <button
                                  className="message-action-btn"
                                  onClick={() => startEditMessage(message)}
                                  title="Editar"
                                >
                                  <FiEdit2 />
                                </button>
                                <button
                                  className="message-action-btn delete"
                                  onClick={() => handleDeleteMessage(message._id)}
                                  title="Eliminar"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-messages">
                    <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files-preview">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-preview-item">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form className="message-input-form" onSubmit={handleSendMessage}>
                {chatMode === 'project' && (
                  <label className="input-action-btn file-upload-label">
                    <FiPaperclip />
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Escribir un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="message-input"
                />
                <EmojiPicker onEmojiSelect={handleEmojiSelect} position="top" />
                <button type="submit" className="send-btn" disabled={!newMessage.trim() && selectedFiles.length === 0}>
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div className="no-project-selected">
              <p>
                {chatMode === 'project' 
                  ? 'Selecciona un proyecto para comenzar a chatear'
                  : 'Selecciona un usuario para comenzar una conversación privada'}
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
