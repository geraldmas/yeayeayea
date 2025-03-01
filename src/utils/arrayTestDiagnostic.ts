import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cette fonction teste différentes façons d'envoyer des tableaux à Supabase
 * pour diagnostiquer l'erreur "cannot cast type jsonb to character varying[]"
 */
export async function testArrayFormats() {
  console.log('=== DÉMARRAGE DU TEST DE DIAGNOSTIC AVANCÉ ===');

  // Récupérer les types de colonnes pour comprendre ce que Supabase attend
  try {
    const { data: columnInfo, error } = await supabase
      .rpc('get_column_types', { table_name: 'cards' });
    
    console.log('Types de colonnes Supabase:', columnInfo);

    if (error) {
      console.error('Erreur lors de la récupération des types de colonnes:', error);
    }
  } catch (e) {
    console.error('Exception lors de la récupération des types de colonnes:', e);
    // Si cette fonction RPC n'existe pas, on continue quand même
  }

  // Selon les résultats, les colonnes spells et tags sont de type JSONB, pas character varying[]
  // Modifions les tests pour qu'ils fonctionnent avec JSONB

  const testCases = [
    {
      name: 'Test 1: Tableau vide direct (JSONB)',
      data: { spells: [], tags: [] }
    },
    {
      name: 'Test 2: Valeur null (JSONB)',
      data: { spells: null, tags: null }
    },
    {
      name: 'Test 3: Tableau de strings (JSONB)',
      data: { spells: ['spell1', 'spell2'], tags: ['tag1', 'tag2'] }
    },
    {
      name: 'Test 4: Objet JSONB',
      data: { 
        spells: [{ id: '1', name: 'spell1' }, { id: '2', name: 'spell2' }], 
        tags: [{ id: '1', name: 'tag1' }, { id: '2', name: 'tag2' }] 
      }
    },
    {
      name: 'Test 5: Chaîne JSON',
      data: { 
        spells: JSON.stringify(['spell1', 'spell2']), 
        tags: JSON.stringify(['tag1', 'tag2'])
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`spells: ${JSON.stringify(testCase.data.spells)}`);
    console.log(`tags: ${JSON.stringify(testCase.data.tags)}`);

    const testCard = {
      id: uuidv4(),
      name: `Test Card ${Date.now()}`,
      description: 'Carte de test pour diagnostic',
      type: 'Créature',
      rarity: 'Commun',
      health: 1,
      spells: testCase.data.spells,
      tags: testCase.data.tags,
      updated_at: new Date().toISOString(),
      is_wip: true
    };

    try {
      // Test standard avec l'API Supabase - maintenant que nous savons que c'est JSONB
      const { data, error } = await supabase
        .from('cards')
        .upsert([testCard], { onConflict: 'id' })
        .select();
        
      if (error) throw error;
      
      console.log(`${testCase.name} réussi ✅`);
      console.log('Données sauvegardées:', data);
    } catch (e) {
      // Ajouter une vérification de type pour l'erreur
      const errorMessage = e instanceof Error ? e.message : 'Erreur inconnue';
      console.error(`${testCase.name} échoué ❌: ${errorMessage}`);
      console.error('Détails de l\'erreur:', e);
    }
  }

  console.log('=== FIN DU TEST DE DIAGNOSTIC AVANCÉ ===');

  // Test pour vérifier la récupération de données JSONB
  console.log('\n=== TEST DE RÉCUPÉRATION DE DONNÉES JSONB ===');
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .limit(3);

    if (error) {
      console.error('Erreur lors de la récupération:', error);
    } else {
      console.log('Cartes récupérées:', data);
      if (data && data.length > 0) {
        console.log('Types des champs récupérés:');
        console.log('spells:', typeof data[0].spells, Array.isArray(data[0].spells));
        console.log('tags:', typeof data[0].tags, Array.isArray(data[0].tags));
        console.log('Exemple de valeur spells:', data[0].spells);
        console.log('Exemple de valeur tags:', data[0].tags);
      }
    }
  } catch (e) {
    console.error('Exception lors de la récupération:', e);
  }

  console.log('\n=== INSPECTION DES TYPES TYPESCRIPT DÉFINIS ===');
  console.log('Vérifiez que les types dans database.types.ts correspondent au schéma de la base de données');
  console.log('Pour les champs JSONB, ils devraient être définis comme any[] ou un type spécifique');

  return 'Tests terminés';
}

/**
 * Fonction utilitaire pour créer une fonction RPC dans Supabase si nécessaire
 * Pour récupérer les types de colonnes et les informations de schéma
 */
export async function setupColumnTypesRPC() {
  // Ce code est à exécuter comme une requête SQL dans la console Supabase
  const sql = `
-- Fonction pour récupérer les types de colonnes d'une table
CREATE OR REPLACE FUNCTION get_column_types(table_name text)
RETURNS TABLE (column_name text, data_type text, udt_name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::text, c.data_type::text, c.udt_name::text
  FROM information_schema.columns c
  WHERE c.table_name = $1
    AND c.table_schema = 'public';
END;
$$;
  `;

  console.log('SQL pour créer la fonction RPC nécessaire:');
  console.log(sql);
  
  return 'Utilisez ces requêtes SQL dans votre console Supabase pour créer les fonctions nécessaires';
}