import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface GameNavProps {
  user: any;
  isAdmin?: boolean;
  onLogout: () => void;
}

const GameNav: React.FC<GameNavProps> = ({ user, isAdmin = false, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Effet pour détecter le défilement de la page
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      if (scrollTop > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour déterminer si un lien est actif
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Toggle menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fermeture du menu mobile après clic sur un lien
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`game-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="game-nav-logo">
          <Link to="/" onClick={closeMobileMenu}>
            <span className="text-primary">TCG</span> Card Editor
          </Link>
        </div>
        
        <div className="game-nav-links">
          <Link 
            to="/cards" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/cards') ? 'active' : ''}`}
          >
            Cartes
          </Link>
          
          <Link 
            to="/boosters" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/boosters') ? 'active' : ''}`}
          >
            Boosters
          </Link>
          
          <Link 
            to="/browser" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/browser') ? 'active' : ''}`}
          >
            Explorateur
          </Link>
          
          <Link 
            to="/alterations" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/alterations') ? 'active' : ''}`}
          >
            Altérations
          </Link>
          
          <Link 
            to="/gameboard" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/gameboard') ? 'active' : ''}`}
          >
            Plateau
          </Link>
          
          {isAdmin && (
            <Link 
              to="/users" 
              onClick={closeMobileMenu}
              className={`nav-link admin-link ${isActive('/users') ? 'active' : ''}`}
            >
              Utilisateurs
            </Link>
          )}
          
          <Link 
            to="/help" 
            onClick={closeMobileMenu}
            className={`nav-link ${isActive('/help') ? 'active' : ''}`}
          >
            Aide
          </Link>
          
          {user ? (
            <div className="user-menu">
              <span className="user-name">{user.username}</span>
              <button onClick={onLogout} className="btn btn-sm btn-outline logout-btn">
                Déconnexion
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              onClick={closeMobileMenu}
              className="btn btn-sm btn-primary login-btn"
            >
              Connexion
            </Link>
          )}
        </div>
        
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>
      
      {/* Menu mobile */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-links">
          <Link 
            to="/cards" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/cards') ? 'active' : ''}`}
          >
            Cartes
          </Link>
          
          <Link 
            to="/boosters" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/boosters') ? 'active' : ''}`}
          >
            Boosters
          </Link>
          
          <Link 
            to="/browser" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/browser') ? 'active' : ''}`}
          >
            Explorateur
          </Link>
          
          <Link 
            to="/alterations" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/alterations') ? 'active' : ''}`}
          >
            Altérations
          </Link>
          
          <Link 
            to="/gameboard" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/gameboard') ? 'active' : ''}`}
          >
            Plateau
          </Link>
          
          {isAdmin && (
            <Link 
              to="/users" 
              onClick={closeMobileMenu}
              className={`mobile-nav-link admin-link ${isActive('/users') ? 'active' : ''}`}
            >
              Utilisateurs
            </Link>
          )}
          
          <Link 
            to="/help" 
            onClick={closeMobileMenu}
            className={`mobile-nav-link ${isActive('/help') ? 'active' : ''}`}
          >
            Aide
          </Link>
          
          {user ? (
            <>
              <span className="mobile-user-name">{user.username}</span>
              <button onClick={onLogout} className="btn btn-outline logout-btn mobile-logout-btn">
                Déconnexion
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              onClick={closeMobileMenu}
              className="btn btn-primary login-btn mobile-login-btn"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default GameNav; 