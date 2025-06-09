export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SpellEffect = {
  type: string;
  value?: number;
  targetType: string;
  subEffects?: WeightedSpellEffect[];
};

export type WeightedSpellEffect = {
  effect: SpellEffect;
  weight: number;
};

export type Spell = {
  name: string;
  description: string;
  effects?: SpellEffect[];
  cost: number;
  range?: {
    min: number;
    max: number;
  };
  is_value_percentage?: boolean;
}

// Définition d'un type pour les effets passifs
export type PassiveEffect = {
  action?: string;
  value?: number;
  description?: string;
  targetType?: string;
  conditions?: Json;
  [key: string]: Json | undefined;
}

export type Tag = {
  name: string;
  passiveEffect: PassiveEffect | null;
}

// Définition d'un type pour les effets d'altération
export type AlterationEffect = {
  action?: string;
  value?: number;
  description?: string;
  targetType?: string;
  duration?: number;
  conditions?: Json;
  [key: string]: Json | undefined;
}

export interface Database {
  public: {
    Tables: {
      migrations: {
        Row: {
          id: number;
          version: string;
          name: string;
          applied_at: string;
          batch: number;
          dependencies: string[];
          status: 'pending' | 'applied' | 'failed' | 'rolled_back';
          error?: string;
          created_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['migrations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['migrations']['Insert']>
      },
      cards: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
          rarity: string;
          properties: Json;
          summon_cost: number | null;  // Nouveau: coût en charisme pour les cartes invoquables
          image: string | null;
          passive_effect: PassiveEffect | null;
          is_wip: boolean;
          is_crap: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
      },
      users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          experience_points: number;
          level: number;
          currency: number;
          settings: Json;
          created_at: string;
          last_login: string | null;
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      },
      card_inventory: {
        Row: {
          user_id: string;
          card_id: number;
          quantity: number;
          favorite: boolean;
          acquired_at: string;
        }
        Insert: Omit<Database['public']['Tables']['card_inventory']['Row'], 'acquired_at'>
        Update: Partial<Database['public']['Tables']['card_inventory']['Insert']>
      },
      decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        }
        Insert: Omit<Database['public']['Tables']['decks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['decks']['Insert']>
      },
      deck_cards: {
        Row: {
          deck_id: string;
          card_id: number;
          quantity: number;
        }
        Insert: Database['public']['Tables']['deck_cards']['Row']
        Update: Partial<Database['public']['Tables']['deck_cards']['Insert']>
      },
      achievements: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          points: number;
          icon_url: string | null;
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      },
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: number;
          unlocked_at: string;
        }
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'unlocked_at'>
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>
      },
      spells: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          cost: number | null;
          effects: Json;
          is_value_percentage: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['spells']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['spells']['Insert']>
      },
      tags: {
        Row: {
          id: number;
          name: string;
          passive_effect: PassiveEffect | null;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      },
      alterations: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          effect: AlterationEffect;
          icon: string;
          duration: number | null;
          stackable: boolean;
          unique_effect: boolean;
          type: 'buff' | 'debuff' | 'status' | 'other';
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['alterations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['alterations']['Insert']>
      },
      game_config: {
        Row: {
          id: number;
          key: string;
          value: Json;
          description: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['game_config']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['game_config']['Insert']>
      },
      simulation_results: {
        Row: {
          id: number;
          simulation_type: 'training' | 'performance' | 'metrics';
          deck_id: string;
          opponent_deck_id: string;
          result: Json;
          metadata: Json;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['simulation_results']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['simulation_results']['Insert']>
      },
      debug_logs: {
        Row: {
          id: number;
          log_type: 'tag_interaction' | 'performance' | 'error';
          severity: 'info' | 'warning' | 'error' | 'critical';
          message: string;
          context: Json;
          stack_trace?: string;
          created_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['debug_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['debug_logs']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}