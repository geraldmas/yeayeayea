// Thème de couleur et de design pour TCG Card Editor
// Ce fichier contient les variables de design global pour l'application

export const theme = {
  // Palette de couleurs principale
  colors: {
    // Primaires (inspirés des jeux vidéo modernes avec un style cyberpunk/fantasy)
    primary: '#7540EE', // Violet électrique, couleur principale d'accent
    primaryDark: '#5620C5', // Version plus sombre du violet pour les boutons pressés
    primaryLight: '#9F7CF9', // Version plus claire du violet pour les survols
    
    // Secondaires
    secondary: '#2FEEA3', // Vert néon pour les actions positives/succès
    secondaryDark: '#20AA74', // Vert foncé pour les boutons secondaires pressés
    secondaryLight: '#7CFBC6', // Vert clair pour les survols secondaires
    
    // Tertiaires
    tertiary: '#EE4040', // Rouge vif pour les actions critiques/alertes
    tertiaryDark: '#AA2020', // Rouge foncé
    tertiaryLight: '#FB7C7C', // Rouge clair
    
    // Fonds
    background: {
      main: '#121220', // Bleu très foncé presque noir pour le fond principal
      card: '#1E1E30', // Bleu foncé pour les cartes et panneaux
      admin: '#201E30', // Variante violacée pour les sections admin
      elevated: '#2A2A40', // Plus clair pour les éléments surélevés
      overlay: 'rgba(0, 0, 0, 0.7)', // Overlay semi-transparent
    },
    
    // Textes
    text: {
      primary: '#FFFFFF', // Blanc pour le texte principal sur fond sombre
      secondary: '#B0B0C0', // Bleu clair pour le texte secondaire
      dimmed: '#8080A0', // Version atténuée pour le texte moins important
      admin: '#FFD700', // Or pour les textes dans les sections admin
      link: '#7CBCFB', // Bleu ciel pour les liens
    },
    
    // Bordures
    border: {
      light: '#353550', // Bordure légère pour les séparateurs
      medium: '#454570', // Bordure moyenne pour les cartes
      strong: '#5A5A90', // Bordure forte pour les éléments importants
      admin: '#806060', // Bordure spéciale pour les sections admin
      focus: '#7540EE', // Bordure pour l'élément en focus
    },
    
    // États
    state: {
      success: '#2FEEA3', // Vert néon pour les succès
      error: '#EE4040', // Rouge vif pour les erreurs
      warning: '#EEAA40', // Orange pour les avertissements
      info: '#40AAEE', // Bleu clair pour les informations
    },
    
    // Raretés des cartes
    rarity: {
      gros_bodycount: '#A0A0A0', // Gris pour les cartes communes
      interessant: '#4090FF', // Bleu pour les cartes peu communes
      banger: '#A040FF', // Violet pour les cartes rares
      cheate: '#FFD700', // Or pour les cartes légendaires
    }
  },
  
  // Typographie
  typography: {
    fontFamily: {
      heading: "'Russo One', sans-serif", // Police pour les titres
      body: "'Exo 2', sans-serif", // Police pour le corps du texte
      monospace: "'Share Tech Mono', monospace", // Police pour le code
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },
  
  // Espacements
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },
  
  // Rayons de bordure
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  // Ombres
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 15px rgba(117, 64, 238, 0.6)', // Lueur violette pour les éléments mis en évidence
    successGlow: '0 0 15px rgba(47, 238, 163, 0.6)', // Lueur verte
    errorGlow: '0 0 15px rgba(238, 64, 64, 0.6)', // Lueur rouge
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease-in-out',
    medium: '0.3s ease-in-out',
    slow: '0.5s ease-in-out',
  },
  
  // Effets spéciaux
  fx: {
    gradients: {
      primary: 'linear-gradient(45deg, #7540EE, #9F7CF9)',
      secondary: 'linear-gradient(45deg, #20AA74, #2FEEA3)',
      error: 'linear-gradient(45deg, #AA2020, #EE4040)',
      card: 'linear-gradient(135deg, #1E1E30, #2A2A40)',
      admin: 'linear-gradient(135deg, #201E30, #302840)',
    },
    overlays: {
      darkened: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
      glassy: 'backdrop-filter: blur(8px)',
    }
  },
  
  // Breakpoints pour le responsive
  breakpoints: {
    xs: '360px',
    sm: '480px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  }
};

export default theme; 