// Fichier de configuration du proxy de développement pour Create React App.
// Ce proxy permet de rediriger les appels API effectués par l'application
// front-end vers le serveur Node/Express local. Cela évite les problèmes de
// CORS en développement et permet d'utiliser des chemins relatifs dans le code.
const { createProxyMiddleware } = require('http-proxy-middleware');

// La fonction exportée sera appelée par Create React App lors du démarrage du
// serveur de développement. On y installe un middleware qui intercepte toutes
// les requêtes commençant par "/api" et les transmet au backend.
module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      // Adresse du serveur backend local
      target: 'http://localhost:3001',
      // Modifie l'en-tête Host pour correspondre à la cible
      changeOrigin: true,
      // Réécrit le chemin pour conserver le préfixe /api tel quel
      pathRewrite: {
        '^/api': '/api'
      }
    })
  );
};
