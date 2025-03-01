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
  is_value_percentage?: boolean;
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
          id: number;
          name: string;
          description: string | null;
          type: 'personnage' | 'objet' | 'evenement' | 'lieu' | 'action';
          rarity: string;
          health: number;
          image: string | null;
          passive_effect: string | null;
          spells: number[];
          tags: number[];
          is_wip: boolean;
          is_crap: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
      },
      spells: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          power: number;
          cost: number | null;
          range_min: number | null;
          range_max: number | null;
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
          passive_effect: string | null;
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
          effect: string;
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