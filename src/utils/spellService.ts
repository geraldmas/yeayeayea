import { supabase } from './supabaseClient';
import { Spell } from '../types';

export const getById = async (id: number): Promise<Spell | null> => {
  const { data, error } = await supabase
    .from('spells')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching spell:', error);
    return null;
  }
  
  return data as Spell;
};

export const getByIds = async (spells: { spell_id: number }[]): Promise<Spell[]> => {
  if (!spells || spells.length === 0) return [];
  
  const spellIds = spells.map((s: { spell_id: number }) => s.spell_id);
  
  const { data, error } = await supabase
    .from('spells')
    .select('*')
    .in('id', spellIds);
    
  if (error) {
    console.error('Error fetching spells:', error);
    return [];
  }
  
  return data as Spell[];
};