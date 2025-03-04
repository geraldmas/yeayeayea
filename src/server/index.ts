import express from 'express';
import authRouter from './auth';
import session from 'express-session';

const app = express();
const port = process.env.SERVER_PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Configuration de la session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes d'authentification
app.use('/api/auth', authRouter);

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
}); 