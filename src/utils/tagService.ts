import { supabase } from './supabaseClient';
import { Tag } from '../types';

export const getById = async (id: number): Promise<Tag | null> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Error fetching tag:', error);
    return null;
  }
  
  return data as Tag;
};

export const getByIds = async (tags: { tag_id: number }[]): Promise<Tag[]> => {
  if (!tags || tags.length === 0) return [];
  
  const tagIds = tags.map(t => t.tag_id);
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds);
    
  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
  
  return data as Tag[];
};