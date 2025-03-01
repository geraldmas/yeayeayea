import { supabase } from './supabaseClient';
import { Database } from '../types/database.types';
import { Spell, Tag, Alteration, SpellEffect } from '../types';

type Tables = Database['public']['Tables'];

export const alterationService = {
  async getAll(): Promise<Alteration[]> {
    const { data, error } = await supabase
      .from('alterations')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getById(id: number): Promise<Alteration | null> {
    const { data, error } = await supabase
      .from('alterations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(alteration: Omit<Alteration, 'id' | 'created_at' | 'updated_at'>): Promise<Alteration> {
    const { data, error } = await supabase
      .from('alterations')
      .insert(alteration)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

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

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('alterations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const spellService = {
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