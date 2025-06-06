import React, { useEffect, useState } from 'react';
import { userService } from '../utils/userService';
import { supabase } from '../utils/supabaseClient';
import type { Achievement } from '../types/userTypes';
import './Achievements.css';

interface AchievementsProps {
  user: { id: string };
}

const Achievements: React.FC<AchievementsProps> = ({ user }) => {
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [locked, setLocked] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userAchievements = await userService.getAchievements(user.id);
        const unlockedAchievements = (userAchievements || []).map((ua: any) => ua.achievements as Achievement);
        setUnlocked(unlockedAchievements);

        const { data: allAchievements, error } = await supabase
          .from('achievements')
          .select('*');
        if (error) throw error;
        const lockedAchievements = (allAchievements || []).filter((a: Achievement) =>
          !unlockedAchievements.some(u => u.id === a.id)
        );
        setLocked(lockedAchievements);
      } catch (err) {
        console.error('Erreur lors du chargement des réalisations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  if (loading) {
    return <div className="achievements-container">Chargement...</div>;
  }

  return (
    <div className="achievements-container">
      <h1>Réalisations</h1>

      <section className="achievements-section">
        <h2>Débloquées</h2>
        <div className="achievements-grid">
          {unlocked.map(ach => (
            <div key={ach.id} className="achievement-card unlocked">
              {ach.icon_url && (
                <img src={ach.icon_url} alt={ach.name} className="achievement-icon" />
              )}
              <div className="achievement-info">
                <h3>{ach.name}</h3>
                <p>{ach.description}</p>
              </div>
            </div>
          ))}
          {unlocked.length === 0 && <p>Aucune réalisation débloquée.</p>}
        </div>
      </section>

      <section className="achievements-section">
        <h2>À débloquer</h2>
        <div className="achievements-grid">
          {locked.map(ach => (
            <div key={ach.id} className="achievement-card locked">
              {ach.icon_url && (
                <img src={ach.icon_url} alt={ach.name} className="achievement-icon" />
              )}
              <div className="achievement-info">
                <h3>{ach.name}</h3>
                <p>{ach.description}</p>
              </div>
            </div>
          ))}
          {locked.length === 0 && <p>Toutes les réalisations sont débloquées !</p>}
        </div>
      </section>
    </div>
  );
};

export default Achievements;
