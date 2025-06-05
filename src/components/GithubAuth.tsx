import React, { useState, useEffect } from 'react';
import { githubService } from '../utils/githubService';

interface GithubAuthProps {
  onAuthStateChange: (isAuthenticated: boolean) => void;
}

const GithubAuth: React.FC<GithubAuthProps> = ({ onAuthStateChange }) => {
  const [token, setToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const auth = await githubService.isAuthenticated();
    setIsAuthenticated(auth);
    onAuthStateChange(auth);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      githubService.setToken(token);
      await checkAuth();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="github-auth">
        <p className="auth-status success">✓ Connecté à GitHub</p>
      </div>
    );
  }

  return (
    <div className="github-auth">
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="GitHub Personal Access Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button type="submit">Se connecter</button>
      </form>
      <p className="auth-help">
        Pour générer un token, allez sur{' '}
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub Settings → Developer settings → Personal access tokens
        </a>
        {' '}et créez un token avec les permissions 'repo'.
      </p>
    </div>
  );
};

export default GithubAuth;
