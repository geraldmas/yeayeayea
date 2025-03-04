import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Vérification des identifiants dans notre table users
      const { data, error } = await supabase
        .rpc('check_password', {
          p_username: username,
          p_password: password
        });

      if (error) throw error;

      if (data) {
        // Mise à jour de la dernière connexion
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.id);

        const userData = {
          id: data.id,
          username: data.username,
          isAdmin: data.properties?.isAdmin || false
        };

        // Si "Rester connecté" est coché, on sauvegarde dans le localStorage
        if (rememberMe) {
          localStorage.setItem('rememberedUser', JSON.stringify(userData));
        } else {
          localStorage.removeItem('rememberedUser');
        }

        onLogin(userData);
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Connexion</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Rester connecté
          </label>
        </div>

        <button type="submit" className="login-button">
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default Login;