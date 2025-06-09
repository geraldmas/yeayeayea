import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import GameNav from './GameNav';
import './GameLayout.css';
import { bgPattern } from '../../assets/images';
import CombatLogViewer from '../CombatLogViewer';

interface GameLayoutProps {
  children: ReactNode;
  user: any;
  isAdmin?: boolean;
  onLogout: () => void;
  isAdminView?: boolean;
}

const GameLayout: React.FC<GameLayoutProps> = ({ 
  children, 
  user, 
  isAdmin = false, 
  onLogout,
  isAdminView = false
}) => {
  // Style dynamique pour l'arrière-plan
  const containerStyle = {
    backgroundImage: `url(${bgPattern}), radial-gradient(circle at 50% 50%, rgba(117, 64, 238, 0.1), transparent 70%)`,
  };

  // Style pour le mode admin
  const adminContainerStyle = {
    backgroundImage: `url(${bgPattern}), radial-gradient(circle at 50% 50%, rgba(238, 64, 64, 0.05), transparent 70%)`,
  };

  return (
    <div 
      className={`app-container ${isAdminView ? 'admin-mode' : ''}`}
      style={isAdminView ? adminContainerStyle : containerStyle}
    >
      <GameNav 
        user={user} 
        isAdmin={isAdmin} 
        onLogout={onLogout} 
      />
      
      <main className={`main-content ${isAdminView ? 'admin-content' : ''}`}>
        {isAdminView && (
          <div className="admin-badge">
            <span className="admin-badge-icon">⚙️</span>
            <span className="admin-badge-text">Mode Administrateur</span>
          </div>
        )}
        
        {children}
      </main>
      
      <footer className="game-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4 className="footer-title">Yeayeayea</h4>
            <p className="footer-description">
              Créez, modifiez et testez vos cartes pour votre propre jeu de cartes à collectionner.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Navigation</h4>
            <ul className="footer-links">
              <li><Link to="/cards">Cartes</Link></li>
              <li><Link to="/boosters">Boosters</Link></li>
              <li><Link to="/browser">Explorateur</Link></li>
              <li><Link to="/gameboard">Plateau</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Aide</h4>
            <ul className="footer-links">
              <li><Link to="/help">Documentation</Link></li>
              <li><Link to="/help#regles">Règles du jeu</Link></li>
              <li><Link to="/help#faq">FAQ</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Yeayeayea. Tous droits réservés.</p>
          <div className="footer-socials">
            <a href="#" className="social-icon">
              <span>🐦</span>
            </a>
            <a href="#" className="social-icon">
              <span>💼</span>
            </a>
            <a href="#" className="social-icon">
              <span>📸</span>
            </a>
          </div>
        </div>
      </footer>
      <CombatLogViewer />
    </div>
  );
};

export default GameLayout; 