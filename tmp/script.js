import { supabase } from '../src/utils/supabaseClient';

async function main() {
  // Connexion à la base
  const { data, error } = await supabase
    .from('cards')
    .update({
      is_wip: true,
      spells: [],
      tags: [],
      talent: null
    });

  if (error) {
    console.error('Erreur lors de la mise à jour des cartes:', error);
  } else {
    console.log('Mise à jour des cartes réussie:', data);
  }
}

main();