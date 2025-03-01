export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SpellEffect = {
  type: string;
  value: number;
  targetType: string;
}

export type Spell = {
  name: string;
  description: string;
  power?: number;
  effects?: SpellEffect[];
  cost: number;
  range?: {
    min: number;
    max: number;
  };
}

export type Tag = {
  name: string;
  passiveEffect: string;
}

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
          rarity: string;
          health: number;
          image: string | null;
          passive_effect: string | null;
          spells: string[];
          talent: string | null;
          tags: string[];
          is_wip: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
      },
      spells: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          power: number;
          cost: number | null;
          range_min: number | null;
          range_max: number | null;
          effects: Json;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['spells']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['spells']['Insert']>
      },
      tags: {
        Row: {
          id: string;
          name: string;
          passive_effect: string | null;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      },
      alterations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          effect: string;
          icon: string;
          duration: number | null;
          stackable: boolean;
          unique_effect: boolean;
          type: 'buff' | 'debuff' | 'status' | 'other';
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['alterations']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['alterations']['Insert']>
      }
    }
  }
}