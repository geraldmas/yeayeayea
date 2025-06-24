import React, { useEffect, useState } from 'react';
import InventoryManager from './InventoryManager';
import CollectionGallery from './CollectionGallery';
import type { Player, Card } from '../types/index';
import { userService } from '../utils/userService';
import { getCardTags } from '../utils/validation';
import { supabase } from '../utils/supabaseClient';

interface InventoryPageProps {
  user: { id: string; username: string; currency?: number };
}

const createPlayer = (user: InventoryPageProps['user'], cards: Card[]): Player => ({
  id: user.id,
  name: user.username,
  activeCard: null,
  benchCards: [],
  inventory: cards,
  hand: [],
  motivation: 0,
  baseMotivation: 0,
  motivationModifiers: [],
  charisme: user.currency ?? 0,
  baseCharisme: 0,
  maxCharisme: 100,
  charismeModifiers: [],
  movementPoints: 0,
  points: 0,
  effects: []
});

const InventoryPage: React.FC<InventoryPageProps> = ({ user }) => {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await userService.getInventory(user.id);
        let cards: Card[] = (items || []).map((i: any) => ({ ...i.cards }));

        // Charger les tags pour chaque carte de l'inventaire
        cards = await Promise.all(
          cards.map(async (card) => {
            try {
              const cardTags = await getCardTags(card.id);
              if (cardTags.length > 0) {
                const { data: tags } = await supabase
                  .from('tags')
                  .select('*')
                  .in('id', cardTags.map(t => t.tag_id));
                return { ...card, tags: tags || [] };
              }
              return { ...card, tags: [] };
            } catch (error) {
              console.error('Erreur chargement tags carte', card.id, error);
              return { ...card, tags: [] };
            }
          })
        );

        setPlayer(createPlayer(user, cards));
      } catch (err) {
        console.error('Erreur lors du chargement de l\'inventaire:', err);
        setPlayer(createPlayer(user, []));
      }
    };
    load();
  }, [user.id]);

  const handleUpdate = async (updated: Player) => {
    if (player) {
      const diff = (updated.charisme || 0) - (player.charisme || 0);
      if (diff !== 0) {
        try {
          await userService.updateCurrency(user.id, diff);
        } catch (err) {
          console.error('Erreur mise \xE0 jour du charisme:', err);
        }
      }
    }
    setPlayer(updated);
  };

  if (!player) return <div>Chargement...</div>;

  return (
    <div>
      <InventoryManager player={player} onUpdate={handleUpdate} />
      <CollectionGallery cards={player.inventory} />
    </div>
  );
};

export default InventoryPage;
