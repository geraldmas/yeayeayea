import React, { useState } from 'react';

interface LoginProps {
  onLogin: (isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    // Mot de passe simple pour démonstration
    if (cleanPassword === 'vanderestgay') {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin(true);
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez le mot de passe"
            className="password-input"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="login-button">
          Se connecter
        </button>
      </form>
    </div>
  );
};

export default Login;