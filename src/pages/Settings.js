import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import MainLayout from '../components/Layout/MainLayout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    organizacion: '',
    email: '',
    password: '',
    nuevaPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        organizacion: user.organizacion || '',
        email: user.email || '',
        password: '',
        nuevaPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar contraseña si se está cambiando
      if (formData.nuevaPassword) {
        if (!formData.password) {
          toast.error('Debes ingresar tu contraseña actual');
          setLoading(false);
          return;
        }
        if (formData.nuevaPassword.length < 6) {
          toast.error('La nueva contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        if (formData.nuevaPassword !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
      }

      const updateData = {
        nombre: formData.nombre,
        organizacion: formData.organizacion
      };

      if (formData.password && formData.nuevaPassword) {
        updateData.password = formData.password;
        updateData.nuevaPassword = formData.nuevaPassword;
      }

      await api.put(`/api/users/${user.id}`, updateData);

      toast.success('Configuración actualizada exitosamente');
      
      // Limpiar campos de contraseña
      setFormData({
        ...formData,
        password: '',
        nuevaPassword: '',
        confirmPassword: ''
      });

      // Si cambió la contraseña, actualizar el token
      if (formData.nuevaPassword) {
        // Recargar la página para actualizar el token
        window.location.reload();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar configuración';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="settings-page">
        <div className="settings-header">
          <h1>Configuración</h1>
          <p>Gestiona tu información personal y preferencias</p>
        </div>

        <div className="settings-content">
          <form onSubmit={handleSubmit} className="settings-form">
            {/* Información Personal */}
            <div className="settings-section">
              <div className="section-header">
                <FiUser className="section-icon" />
                <h2>Información Personal</h2>
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
                <small className="form-help">El email no se puede cambiar</small>
              </div>

              <div className="form-group">
                <label htmlFor="organizacion">Organización</label>
                <input
                  type="text"
                  id="organizacion"
                  name="organizacion"
                  value={formData.organizacion}
                  onChange={handleChange}
                  placeholder="Nombre de tu organización"
                />
              </div>
            </div>

            {/* Seguridad */}
            <div className="settings-section">
              <div className="section-header">
                <FiLock className="section-icon" />
                <h2>Seguridad</h2>
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña Actual</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Solo si deseas cambiar la contraseña"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <small className="form-help">Deja en blanco si no quieres cambiar la contraseña</small>
              </div>

              <div className="form-group">
                <label htmlFor="nuevaPassword">Nueva Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="nuevaPassword"
                    name="nuevaPassword"
                    value={formData.nuevaPassword}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la nueva contraseña"
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="submit"
                className="btn-primary save-btn"
                disabled={loading}
              >
                <FiSave className="btn-icon" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;

