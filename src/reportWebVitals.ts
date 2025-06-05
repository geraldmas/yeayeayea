// Utilitaire généré par Create React App pour mesurer les performances de
// l'application. Les métriques de Web Vitals peuvent être remontées vers un
// service d'analyse ou simplement affichées en console.
import { ReportHandler } from 'web-vitals';

/**
 * Démarre la collecte des Web Vitals si un gestionnaire est fourni.
 * @param onPerfEntry Fonction appelée pour chaque métrique enregistrée
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Chargement dynamique afin de ne pas alourdir le bundle principal
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
