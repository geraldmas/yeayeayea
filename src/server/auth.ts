import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthenticatedRequest extends Request {
  user?: any;
}

interface LoginRequest {
  username: string;
  password: string;
}

// Route de connexion
router.post('/login', (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { username, password } = req.body;

  supabase.auth.signInWithPassword({
    email: username,
    password: password,
  })
  .then(({ data: user, error }) => {
    if (error) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { 
        id: user.user?.id, 
        email: user.user?.email,
        isAdmin: user.user?.user_metadata?.isAdmin || false 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.user?.id,
        email: user.user?.email,
        isAdmin: user.user?.user_metadata?.isAdmin || false
      },
      token
    });
  })
  .catch((error) => {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  });
});

// Middleware de vérification du token
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware de vérification des droits admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
  next();
};

export default router; 