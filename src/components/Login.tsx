import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import './Login.css';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);

    try {
      console.log(`🔐 Tentative de connexion pour l'utilisateur: ${username}`);
      
      // 1. Appel à la fonction check_password
      const { data, error: rpcError } = await supabase
        .rpc('check_password', {
          p_username: username,
          p_password: password
        });
      
      // Logging détaillé pour le débogage
      console.log('📊 Résultat de check_password:', data);
      
      // Gestion des erreurs RPC
      if (rpcError) {
        console.error('❌ Erreur RPC:', rpcError);
        throw new Error(`Erreur serveur: ${rpcError.message}`);
      }
      
      // Vérifier si les identifiants sont valides
      if (!data) {
        setDebugInfo("L'appel à check_password n'a pas retourné de données. Vérifiez les logs Supabase.");
        throw new Error("Identifiants incorrects");
      }
      
      // 2. Mise à jour de la date de dernière connexion
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
      
      if (updateError) {
        console.warn('⚠️ Impossible de mettre à jour la date de dernière connexion:', updateError);
      }
      
      // 3. Création de l'objet utilisateur pour la session
      const userData = {
        id: data.id,
        username: data.username,
        is_admin: Boolean(data.is_admin), // Conversion explicite en booléen
        properties: data.properties || {},
        token: `auth_${Date.now()}` // Token simple avec timestamp
      };
      
      console.log('👤 Utilisateur authentifié:', userData);
      console.log('🔑 Statut admin:', userData.is_admin ? 'OUI' : 'NON');
      
      // 4. Sauvegarde dans localStorage selon les préférences
      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify(userData));
        console.log('💾 Informations utilisateur sauvegardées (se souvenir de moi)');
      } else {
        localStorage.removeItem('rememberedUser');
      }
      
      // Toujours sauvegarder dans localStorage pour la session actuelle
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 5. Notification à l'application parente
      onLogin(userData);
      
    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      setError(error.message || "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />
          </div>
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="rememberMe">Se souvenir de moi</label>
          </div>
          {error && (
            <div className="error-message">
              {error}
              {debugInfo && (
                <details>
                  <summary>Informations de débogage</summary>
                  <p>{debugInfo}</p>
                </details>
              )}
            </div>
          )}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        <div className="login-help">
          <p>
            En cas de problème de connexion, contactez l'administrateur ou{' '}
            <a href="/clear-storage.html" target="_blank">
              utilisez l'outil de débogage
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;