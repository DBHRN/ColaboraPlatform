import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [organizacion, setOrganizacion] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isRegister) {
      result = await register(nombre, email, password, organizacion);
    } else {
      result = await login(email, password);
    }

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-large">
            <div className="logo-icon-large">📁</div>
            <h1>Colabora</h1>
            <p>Herramienta de Trabajo Colaborativo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Nombre Completo</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="text"
                  placeholder="Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div className="form-group">
              <label>Organización</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="text"
                  placeholder="Mi Organización"
                  value={organizacion}
                  onChange={(e) => setOrganizacion(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Correo Electrónico Institucional</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="usuario@ual.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {!isRegister && (
            <a href="#" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            <FiLogIn className="btn-icon" />
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            className="microsoft-btn"
            onClick={() => alert('Integración con Microsoft 365 próximamente')}
          >
            <svg width="20" height="20" viewBox="0 0 23 23" fill="none">
              <rect x="0" y="0" width="11" height="11" fill="#F25022"/>
              <rect x="12" y="0" width="11" height="11" fill="#7FBA00"/>
              <rect x="0" y="12" width="11" height="11" fill="#00A4EF"/>
              <rect x="12" y="12" width="11" height="11" fill="#FFB900"/>
            </svg>
            Iniciar Sesión con Microsoft 365
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button
              type="button"
              className="toggle-mode"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Inicia Sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

