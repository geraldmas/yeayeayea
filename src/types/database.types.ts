export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          id: string
          name: string
          description: string | null
          type: 'personnage' | 'objet' | 'evenement' | 'lieu'
          rarity: string
          health: number
          image: string | null
          passive_effect: string | null
          spells: Json | null
          talent: Json | null
          tags: Json | null
          is_wip: boolean
          created_at?: string
          updated_at?: string
        }
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['cards']['Insert']>
      }
    }
  }
}