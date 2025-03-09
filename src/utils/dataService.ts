import { supabase } from './supabaseClient';
import { Database, Json } from '../types/database.types';
import { Spell, Tag, Alteration, SpellEffect } from '../types';

/**
 * @file dataService.ts
 * @description Service pour la gestion des données du jeu Yeayeayea
 * Ce module fournit des fonctions pour interagir avec la base de données Supabase
 * et gérer les relations entre les différentes entités (cartes, tags, sorts, etc.)
 */

/**
 * Service pour gérer les relations entre les tables (many-to-many)
 * Gère les associations entre cartes, tags et sorts
 */
export const joinTableService = {
  /**
   * Récupère les identifiants des tags associés à une carte spécifique
   * @param cardId - L'identifiant de la carte
   * @returns Un tableau d'objets contenant les identifiants des tags
   * @throws Erreur en cas d'échec de la requête
   */
  async getTagsByCardId(cardId: number) {
    const { data, error } = await supabase
      .from('card_tags')
      .select('tag_id')
      .eq('card_id', cardId);
    
    if (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      throw error;
    }
    
    return data || [];
  },
  
  /**
   * Récupère les identifiants des sorts associés à une carte spécifique
   * @param cardId - L'identifiant de la carte
   * @returns Un tableau d'objets contenant les identifiants des sorts
   * @throws Erreur en cas d'échec de la requête
   */
  async getSpellsByCardId(cardId: number) {
    const { data, error } = await supabase
      .from('card_spells')
      .select('spell_id')
      .eq('card_id', cardId);
    
    if (error) {
      console.error('Erreur lors de la récupération des sorts:', error);
      throw error;
    }
    
    return data || [];
  },

  /**
   * Met à jour les tags associés à une carte
   * @param cardId - L'identifiant de la carte
   * @param tagIds - Tableau d'identifiants des tags à associer
   * @throws Erreur si les tags n'existent pas ou en cas d'échec de la mise à jour
   */
  async updateCardTags(cardId: number, tagIds: number[]) {
    // Vérifier d'abord que tous les tags existent
    const { data: existingTags, error: tagCheckError } = await supabase
      .from('tags')
      .select('id')
      .in('id', tagIds);

    if (tagCheckError) {
      console.error('Erreur lors de la vérification des tags:', tagCheckError);
      throw tagCheckError;
    }

    if (existingTags.length !== tagIds.length) {
      throw new Error('Certains tags n\'existent pas dans la base de données');
    }

    // Supprimer les anciennes relations
    const { error: deleteError } = await supabase
      .from('card_tags')
      .delete()
      .eq('card_id', cardId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciens tags:', deleteError);
      throw deleteError;
    }

    // Ajouter les nouvelles relations
    if (tagIds.length > 0) {
      const { error: insertError } = await supabase
        .from('card_tags')
        .insert(tagIds.map(tagId => ({ card_id: cardId, tag_id: tagId })));

      if (insertError) {
        console.error('Erreur lors de l\'ajout des nouveaux tags:', insertError);
        throw insertError;
      }
    }

    return true;
  },

  async updateCardSpells(cardId: number, spellIds: number[]) {
    // Vérifier d'abord que tous les sorts existent
    const { data: existingSpells, error: spellCheckError } = await supabase
      .from('spells')
      .select('id')
      .in('id', spellIds);

    if (spellCheckError) {
      console.error('Erreur lors de la vérification des sorts:', spellCheckError);
      throw spellCheckError;
    }

    if (existingSpells.length !== spellIds.length) {
      throw new Error('Certains sorts n\'existent pas dans la base de données');
    }

    // Supprimer les anciennes relations
    const { error: deleteError } = await supabase
      .from('card_spells')
      .delete()
      .eq('card_id', cardId);

    if (deleteError) {
      console.error('Erreur lors de la suppression des anciens sorts:', deleteError);
      throw deleteError;
    }

    // Ajouter les nouvelles relations
    if (spellIds.length > 0) {
      const { error: insertError } = await supabase
        .from('card_spells')
        .insert(spellIds.map(spellId => ({ card_id: cardId, spell_id: spellId })));

      if (insertError) {
        console.error('Erreur lors de l\'ajout des nouveaux sorts:', insertError);
        throw insertError;
      }
    }

    return true;
  }
};

/**
 * Service pour la gestion des altérations
 * Fournit les opérations CRUD pour les altérations dans le jeu
 */
export const alterationService = {
  /**
   * Récupère toutes les altérations disponibles
   * @returns Une promesse contenant la liste de toutes les altérations
   * @throws Erreur en cas d'échec de la requête
   */
  async getAll(): Promise<Alteration[]> {
    const { data, error } = await supabase
      .from('alterations')
      .select('*');
    if (error) throw error;
    return data;
  },

  /**
   * Récupère une altération par son identifiant
   * @param id - L'identifiant de l'altération à récupérer
   * @returns Une promesse contenant l'altération ou null si non trouvée
   * @throws Erreur en cas d'échec de la requête
   */
  async getById(id: number): Promise<Alteration | null> {
    const { data, error } = await supabase
      .from('alterations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle altération
   * @param alteration - L'objet altération à créer (sans id, created_at, updated_at)
   * @returns Une promesse contenant l'altération créée avec son id
   * @throws Erreur en cas d'échec de la création
   */
  async create(alteration: Omit<Alteration, 'id' | 'created_at' | 'updated_at'>): Promise<Alteration> {
    const { data, error } = await supabase
      .from('alterations')
      .insert(alteration)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une altération existante
   * @param id - L'identifiant de l'altération à mettre à jour
   * @param alteration - Objet partiel contenant les champs à mettre à jour
   * @returns Une promesse contenant l'altération mise à jour
   * @throws Erreur en cas d'échec de la mise à jour
   */
  async update(id: number, alteration: Partial<Omit<Alteration, 'id' | 'created_at' | 'updated_at'>>): Promise<Alteration> {
    const { data, error } = await supabase
      .from('alterations')
      .update(alteration)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Supprime une altération
   * @param id - L'identifiant de l'altération à supprimer
   * @throws Erreur en cas d'échec de la suppression
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('alterations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

/**
 * Service pour la gestion des sorts
 * Fournit les opérations CRUD pour les sorts des cartes
 */
export const spellService = {
  /**
   * Récupère tous les sorts disponibles
   * @returns Une promesse contenant la liste de tous les sorts
   * @throws Erreur en cas d'échec de la requête
   */
  async getAll(): Promise<Spell[]> {
    const { data, error } = await supabase
      .from('spells')
      .select('*');
    if (error) throw error;
    return data.map(spell => ({
      ...spell,
      effects: JSON.parse(spell.effects as string) as SpellEffect[]
    }));
  },

  /**
   * Récupère un sort par son identifiant
   * @param id - L'identifiant du sort à récupérer
   * @returns Une promesse contenant le sort ou null si non trouvé
   * @throws Erreur en cas d'échec de la requête
   */
  async getById(id: number): Promise<Spell | null> {
    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      effects: JSON.parse(data.effects as string) as SpellEffect[]
    };
  },

  async create(spell: Omit<Spell, 'id' | 'created_at' | 'updated_at'>): Promise<Spell> {
    const formattedSpell = {
      ...spell,
      effects: JSON.stringify(spell.effects || [])
    };
    const { data, error } = await supabase
      .from('spells')
      .insert(formattedSpell)
      .select()
      .single();
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    return {
      ...data,
      effects: JSON.parse(data.effects as string) as SpellEffect[]
    };
  },

  async update(id: number, spell: Partial<Omit<Spell, 'id' | 'created_at' | 'updated_at'>>): Promise<Spell> {
    const formattedSpell = {
      ...spell,
      effects: spell.effects ? JSON.stringify(spell.effects) : undefined
    };
    const { data, error } = await supabase
      .from('spells')
      .update(formattedSpell)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      effects: JSON.parse(data.effects as string) as SpellEffect[]
    };
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('spells')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByIds(ids: number[]): Promise<Spell[]> {
    if (!ids || ids.length === 0) return [];
    
    const validIds = ids.filter(id => typeof id === 'number');
    if (validIds.length === 0) return [];

    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .in('id', validIds);
    
    if (error) throw error;
    return (data || []).map(spell => ({
      ...spell,
      effects: JSON.parse(spell.effects as string) as SpellEffect[]
    }));
  }
};

export const tagService = {
  async getAll(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getById(id: number): Promise<Tag | null> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: number, tag: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(tag)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByIds(ids: number[]): Promise<Tag[]> {
    if (!ids || ids.length === 0) return [];
    
    const validIds = ids.filter(id => typeof id === 'number');
    if (validIds.length === 0) return [];

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .in('id', validIds);
    
    if (error) throw error;
    return data || [];
  }
};

export const gameConfigService = {
  async getAll(): Promise<Database['public']['Tables']['game_config']['Row'][]> {
    const { data, error } = await supabase
      .from('game_config')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getByKey(key: string): Promise<Database['public']['Tables']['game_config']['Row'] | null> {
    const { data, error } = await supabase
      .from('game_config')
      .select('*')
      .eq('key', key)
      .single();
    if (error) throw error;
    return data;
  },

  async update(key: string, value: Json): Promise<Database['public']['Tables']['game_config']['Row']> {
    const { data, error } = await supabase
      .from('game_config')
      .update({ value })
      .eq('key', key)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getValue<T>(key: string): Promise<T | null> {
    const config = await this.getByKey(key);
    if (!config) return null;
    
    try {
      // Vérifie d'abord si la valeur a une structure { value: T }
      if (config.value && typeof config.value === 'object' && 'value' in config.value) {
        return (config.value as { value: T }).value;
      }
      
      // Sinon, essaie de retourner la valeur directement
      return config.value as unknown as T;
    } catch (error) {
      console.warn(`Erreur lors de l'accès à la configuration '${key}':`, error);
      return null;
    }
  }
};

export const simulationResultsService = {
  async getAll(): Promise<Database['public']['Tables']['simulation_results']['Row'][]> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getById(id: number): Promise<Database['public']['Tables']['simulation_results']['Row'] | null> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(simulation: Omit<Database['public']['Tables']['simulation_results']['Row'], 'id' | 'created_at' | 'updated_at'>): Promise<Database['public']['Tables']['simulation_results']['Row']> {
    const { data, error } = await supabase
      .from('simulation_results')
      .insert(simulation)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByType(type: 'training' | 'performance' | 'metrics'): Promise<Database['public']['Tables']['simulation_results']['Row'][]> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('simulation_type', type);
    if (error) throw error;
    return data;
  },

  async getByDeck(deckId: string): Promise<Database['public']['Tables']['simulation_results']['Row'][]> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .or(`deck_id.eq.${deckId},opponent_deck_id.eq.${deckId}`);
    if (error) throw error;
    return data;
  },

  async getDeckPerformance(deckId: string): Promise<{
    winRate: number;
    averageTurns: number;
    totalGames: number;
  }> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('result')
      .eq('deck_id', deckId)
      .eq('simulation_type', 'performance');
    
    if (error) throw error;
    
    const results = data.map(r => r.result as { won: boolean; turns: number });
    const totalGames = results.length;
    const wins = results.filter(r => r.won).length;
    const totalTurns = results.reduce((sum, r) => sum + r.turns, 0);
    
    return {
      winRate: totalGames > 0 ? wins / totalGames : 0,
      averageTurns: totalGames > 0 ? totalTurns / totalGames : 0,
      totalGames
    };
  }
};

export const debugLogsService = {
  async create(log: Omit<Database['public']['Tables']['debug_logs']['Row'], 'id' | 'created_at'>): Promise<Database['public']['Tables']['debug_logs']['Row']> {
    const { data, error } = await supabase
      .from('debug_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByType(type: 'tag_interaction' | 'performance' | 'error'): Promise<Database['public']['Tables']['debug_logs']['Row'][]> {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('log_type', type)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getBySeverity(severity: 'info' | 'warning' | 'error' | 'critical'): Promise<Database['public']['Tables']['debug_logs']['Row'][]> {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('severity', severity)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getRecentLogs(limit: number = 100): Promise<Database['public']['Tables']['debug_logs']['Row'][]> {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getTagInteractions(cardId: number): Promise<Database['public']['Tables']['debug_logs']['Row'][]> {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('log_type', 'tag_interaction')
      .contains('context', { card_id: cardId })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPerformanceMetrics(timeRange: { start: Date; end: Date }): Promise<{
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  }> {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('*')
      .eq('log_type', 'performance')
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString());
    
    if (error) throw error;
    
    const metrics = data.map(log => log.context as { response_time: number; is_error: boolean });
    const totalRequests = metrics.length;
    const totalResponseTime = metrics.reduce((sum, m) => sum + m.response_time, 0);
    const errorCount = metrics.filter(m => m.is_error).length;
    
    return {
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      totalRequests,
      errorRate: totalRequests > 0 ? errorCount / totalRequests : 0
    };
  }
};