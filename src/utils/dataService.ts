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

  async getById(id: string): Promise<Alteration | null> {
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

  async update(id: string, alteration: Partial<Omit<Alteration, 'id' | 'created_at' | 'updated_at'>>): Promise<Alteration> {
    const { data, error } = await supabase
      .from('alterations')
      .update(alteration)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
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
      effects: spell.effects as unknown as SpellEffect[]
    }));
  },

  async getById(id: string): Promise<Spell | null> {
    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      effects: data.effects as unknown as SpellEffect[]
    };
  },

  async create(spell: Omit<Spell, 'id' | 'created_at' | 'updated_at'>): Promise<Spell> {
    const { data, error } = await supabase
      .from('spells')
      .insert({
        ...spell,
        effects: spell.effects as any
      })
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      effects: data.effects as unknown as SpellEffect[]
    };
  },

  async update(id: string, spell: Partial<Omit<Spell, 'id' | 'created_at' | 'updated_at'>>): Promise<Spell> {
    const updateData = {
      ...spell
    };
    if ('effects' in updateData) {
      updateData.effects = updateData.effects as any;
    }
    const { data, error } = await supabase
      .from('spells')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      effects: data.effects as unknown as SpellEffect[]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('spells')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByIds(ids: string[]): Promise<Spell[]> {
    const { data, error } = await supabase
      .from('spells')
      .select('*')
      .in('id', ids);
    if (error) throw error;
    return data;
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

  async getById(id: string): Promise<Tag | null> {
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

  async update(id: string, tag: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>>): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(tag)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getByIds(ids: string[]): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .in('id', ids);
    if (error) throw error;
    return data;
  }
};