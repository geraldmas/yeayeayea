import { supabase } from './supabaseClient';

interface ExportResult {
  data?: any;
  error?: Error;
}

export const exportCards = async (): Promise<ExportResult> => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*');

    if (error) throw error;
    return { data };
  } catch (error) {
    return { error: error as Error };
  }
}; 