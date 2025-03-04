import { supabase } from './supabaseClient';
import { Database } from '../types/database.types';

type Card = Database['public']['Tables']['cards']['Insert'];
type Tag = Database['public']['Tables']['tags']['Insert'];
type Spell = Database['public']['Tables']['spells']['Insert'];
type Alteration = Database['public']['Tables']['alterations']['Insert'];

class SeedService {
  async seedTags(): Promise<void> {
    const tags: Tag[] = [
      {
        name: 'NUIT',
        passive_effect: {
          action: 'increase',
          value: 20,
          description: 'Augmente les dégâts de 20%',
          targetType: 'damage'
        }
      },
      {
        name: 'JOUR',
        passive_effect: {
          action: 'increase',
          value: 20,
          description: 'Augmente la défense de 20%',
          targetType: 'defense'
        }
      },
      {
        name: 'FRAGILE',
        passive_effect: {
          action: 'decrease',
          value: 30,
          description: 'Réduit les PV de 30%',
          targetType: 'hp'
        }
      }
    ];

    for (const tag of tags) {
      const { error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;
    }
  }

  async seedSpells(): Promise<void> {
    const spells: Spell[] = [
      {
        name: 'Boule de Feu',
        description: 'Inflige des dégâts de feu',
        power: 30,
        cost: 3,
        range_min: 1,
        range_max: 3,
        effects: [{
          type: 'damage',
          value: 30,
          targetType: 'enemy'
        }],
        is_value_percentage: false
      },
      {
        name: 'Soin',
        description: 'Restaure des points de vie',
        power: 25,
        cost: 2,
        range_min: 1,
        range_max: 1,
        effects: [{
          type: 'heal',
          value: 25,
          targetType: 'ally'
        }],
        is_value_percentage: false
      }
    ];

    for (const spell of spells) {
      const { error } = await supabase
        .from('spells')
        .insert(spell)
        .select()
        .single();

      if (error) throw error;
    }
  }

  async seedAlterations(): Promise<void> {
    const alterations: Alteration[] = [
      {
        name: 'Brûlure',
        description: 'Inflige des dégâts de feu sur la durée',
        effect: {
          action: 'damage',
          value: 10,
          description: 'Inflige 10 dégâts par tour',
          targetType: 'self',
          duration: 3
        },
        icon: 'fire',
        duration: 3,
        stackable: true,
        unique_effect: false,
        type: 'debuff'
      },
      {
        name: 'Bouclier',
        description: 'Réduit les dégâts reçus',
        effect: {
          action: 'reduce',
          value: 50,
          description: 'Réduit les dégâts reçus de 50%',
          targetType: 'damage',
          duration: 2
        },
        icon: 'shield',
        duration: 2,
        stackable: false,
        unique_effect: true,
        type: 'buff'
      }
    ];

    for (const alteration of alterations) {
      const { error } = await supabase
        .from('alterations')
        .insert(alteration)
        .select()
        .single();

      if (error) throw error;
    }
  }

  async seedCards(): Promise<void> {
    // Cartes personnage
    const characters: Card[] = [
      {
        name: 'Guerrier',
        description: 'Un combattant robuste',
        type: 'personnage',
        rarity: 'common',
        properties: {
          hp: 100,
          attack: 15,
          defense: 10
        },
        summon_cost: 5,
        passive_effect: null,
        is_wip: false,
        is_crap: false,
        image: 'warrior.png'
      },
      {
        name: 'Mage',
        description: 'Un magicien puissant',
        type: 'personnage',
        rarity: 'rare',
        properties: {
          hp: 80,
          attack: 20,
          defense: 5
        },
        summon_cost: 7,
        passive_effect: {
          action: 'increase',
          value: 20,
          description: 'Augmente les dégâts des sorts de 20%',
          targetType: 'spell_damage'
        },
        is_wip: false,
        is_crap: false,
        image: 'mage.png'
      }
    ];

    // Cartes lieu
    const locations: Card[] = [
      {
        name: 'Forêt',
        description: 'Un lieu mystérieux',
        type: 'lieu',
        rarity: 'common',
        properties: {
          effect: 'heal',
          value: 5,
          duration: 'permanent'
        },
        summon_cost: null,
        passive_effect: {
          action: 'heal',
          value: 5,
          description: 'Restaure 5 PV par tour',
          targetType: 'all_allies'
        },
        is_wip: false,
        is_crap: false,
        image: 'forest.png'
      }
    ];

    // Cartes objet
    const items: Card[] = [
      {
        name: 'Épée',
        description: 'Une arme puissante',
        type: 'objet',
        rarity: 'common',
        properties: {
          slot: 'weapon',
          attack: 10
        },
        summon_cost: null,
        passive_effect: {
          action: 'increase',
          value: 10,
          description: 'Augmente l\'attaque de 10',
          targetType: 'attack'
        },
        is_wip: false,
        is_crap: false,
        image: 'sword.png'
      }
    ];

    // Cartes action
    const actions: Card[] = [
      {
        name: 'Frappe',
        description: 'Une attaque puissante',
        type: 'action',
        rarity: 'common',
        properties: {
          cost: 3,
          damage: 20
        },
        summon_cost: null,
        passive_effect: null,
        is_wip: false,
        is_crap: false,
        image: 'strike.png'
      }
    ];

    // Cartes événement
    const events: Card[] = [
      {
        name: 'Tempête',
        description: 'Une tempête s\'abat sur le terrain',
        type: 'evenement',
        rarity: 'rare',
        properties: {
          duration: 3,
          effect: 'damage_all'
        },
        summon_cost: null,
        passive_effect: {
          action: 'damage',
          value: 10,
          description: 'Inflige 10 dégâts à tous les personnages',
          targetType: 'all'
        },
        is_wip: false,
        is_crap: false,
        image: 'storm.png'
      }
    ];

    const allCards = [...characters, ...locations, ...items, ...actions, ...events];

    for (const card of allCards) {
      const { error } = await supabase
        .from('cards')
        .insert(card)
        .select()
        .single();

      if (error) throw error;
    }
  }

  async seedGameConfig(): Promise<void> {
    const configs = [
      {
        key: 'max_personnages',
        value: { value: 5 },
        description: 'Nombre maximum de personnages sur le terrain'
      },
      {
        key: 'emplacements_objet',
        value: { value: 3 },
        description: 'Nombre d\'emplacements d\'objets par personnage'
      },
      {
        key: 'budget_motivation_initial',
        value: { value: 10 },
        description: 'Budget de motivation initial par tour'
      },
      {
        key: 'pv_base_initial',
        value: { value: 100 },
        description: 'Points de vie initiaux de la base'
      }
    ];

    for (const config of configs) {
      const { error } = await supabase
        .from('game_config')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
    }
  }

  async seedAll(): Promise<void> {
    try {
      await this.seedTags();
      await this.seedSpells();
      await this.seedAlterations();
      await this.seedCards();
      await this.seedGameConfig();
      console.log('Données initiales insérées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'insertion des données initiales:', error);
      throw error;
    }
  }
}

export const seedService = new SeedService(); 