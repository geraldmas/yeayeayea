import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import './UserManager.css';

interface User {
  id: string;
  username: string;
  experience_points: number;
  level: number;
  currency: number;
  properties: {
    [key: string]: any;
  };
  is_admin: boolean;
  created_at: string;
  last_login: string | null;
}

interface UserFormData {
  username: string;
  password: string;
  isAdmin: boolean;
  experience_points: number;
  level: number;
  currency: number;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Formulaire de création/édition
  const emptyFormData: UserFormData = {
    username: '',
    password: '',
    isAdmin: false,
    experience_points: 0,
    level: 1,
    currency: 0
  };
  
  const [formData, setFormData] = useState<UserFormData>(emptyFormData);

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    fetchUsers();
  }, []);

  // Récupérer tous les utilisateurs
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getAllUsers();
      setUsers(data as User[]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : name === 'experience_points' || name === 'level' || name === 'currency' 
        ? parseInt(value) || 0 
        : value
    });
  };

  // Soumettre le formulaire pour créer/modifier un utilisateur
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (editingUser) {
        // Mise à jour d'un utilisateur existant
        await adminService.updateUser(editingUser.id, formData);
      } else {
        // Création d'un nouvel utilisateur
        await adminService.createUser(formData);
      }
      
      // Réinitialiser le formulaire et recharger les utilisateurs
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de l\'utilisateur');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await adminService.deleteUser(userId);
      setConfirmDelete(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de l\'utilisateur');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Changer le statut d'administrateur
  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      await adminService.setAdminStatus(userId, isAdmin);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du statut administrateur');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Commencer à éditer un utilisateur
  const startEditing = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // On ne remplit pas le mot de passe pour des raisons de sécurité
      isAdmin: user.is_admin,
      experience_points: user.experience_points,
      level: user.level,
      currency: user.currency
    });
    setShowAddForm(true);
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingUser(null);
    setShowAddForm(false);
  };

  // Formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="user-manager">
      <h2>Gestion des Utilisateurs</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="user-actions">
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="btn btn-primary"
        >
          {showAddForm ? 'Annuler' : 'Ajouter un utilisateur'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="user-form-container">
          <h3>{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</h3>
          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                minLength={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                Mot de passe {editingUser && '(laisser vide pour ne pas modifier)'}
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
                minLength={6}
              />
            </div>
            
            <div className="form-group checkbox">
              <label htmlFor="isAdmin">
                <input
                  id="isAdmin"
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                />
                Administrateur
              </label>
            </div>
            
            <div className="form-group">
              <label htmlFor="level">Niveau</label>
              <input
                id="level"
                type="number"
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                min={1}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="experience_points">Points d'expérience</label>
              <input
                id="experience_points"
                type="number"
                name="experience_points"
                value={formData.experience_points}
                onChange={handleInputChange}
                min={0}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="currency">Monnaie</label>
              <input
                id="currency"
                type="number"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                min={0}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="users-list">
        {isLoading && !users.length ? (
          <div className="loading">Chargement des utilisateurs...</div>
        ) : users.length === 0 ? (
          <div className="no-users">Aucun utilisateur trouvé</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Nom d'utilisateur</th>
                <th>Niveau</th>
                <th>XP</th>
                <th>Monnaie</th>
                <th>Admin</th>
                <th>Création</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.properties?.isAdmin ? 'admin-user' : ''}>
                  <td>{user.username}</td>
                  <td>{user.level}</td>
                  <td>{user.experience_points}</td>
                  <td>{user.currency}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={user.is_admin}
                        onChange={(e) => handleAdminToggle(user.id, e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{formatDate(user.last_login)}</td>
                  <td className="actions">
                    <button
                      onClick={() => startEditing(user)}
                      className="btn btn-edit"
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    
                    {confirmDelete === user.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-delete-confirm"
                          title="Confirmer la suppression"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="btn btn-delete-cancel"
                          title="Annuler"
                        >
                          ✗
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="btn btn-delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManager; 