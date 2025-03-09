import React, { ReactNode } from 'react';
import GameNav from './GameNav';
import './GameLayout.css';

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
  return (
    <div className={`app-container ${isAdminView ? 'admin-mode' : ''}`}>
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
            <h4 className="footer-title">TCG Card Editor</h4>
            <p className="footer-description">
              Créez, modifiez et testez des cartes pour votre propre jeu de cartes à collectionner.
            </p>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Navigation</h4>
            <ul className="footer-links">
              <li><a href="/cards">Cartes</a></li>
              <li><a href="/boosters">Boosters</a></li>
              <li><a href="/browser">Explorateur</a></li>
              <li><a href="/gameboard">Plateau</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-title">Aide</h4>
            <ul className="footer-links">
              <li><a href="/help">Documentation</a></li>
              <li><a href="/help#regles">Règles du jeu</a></li>
              <li><a href="/help#faq">FAQ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} TCG Card Editor. Tous droits réservés.</p>
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
    </div>
  );
};

export default GameLayout; 