import { Card } from '../types';
import { saveCard } from './supabaseClient';

// Fonction de test pour diagnostiquer le problème de conversion des types
export async function testCardSave() {
  console.log('=== DÉMARRAGE DU TEST DE DIAGNOSTIC ===');
  
  // Cas 0: Tableau vide (cas qui causait le bug)
  const testCard0: Card = {
    id: 'test-card-0',
    name: 'Test Card Empty Arrays',
    description: 'Test avec tableaux vides',
    type: 'personnage',
    rarity: 'banger',
    health: 10,
    image: '',
    spells: [], // Tableau vide qui causait le problème
    tags: [],   // Tableau vide qui causait le problème
    isWIP: true
  };
  
  console.log('Test 0: Tableau vide (cas du bug)');
  console.log('spells:', testCard0.spells);
  console.log('tags:', testCard0.tags);
  
  try {
    await saveCard(testCard0);
    console.log('Test 0 réussi');
  } catch (error) {
    console.error('Test 0 échoué:', error);
  }
  
  // Cas 1: Tableau de chaînes simples
  const testCard1: Card = {
    id: 'test-card-1',
    name: 'Test Card 1',
    description: 'Test description',
    type: 'personnage',
    rarity: 'banger',
    health: 10,
    image: '',
    spells: ['spell1', 'spell2'],
    tags: ['tag1', 'tag2'],
    isWIP: true
  };
  
  console.log('Test 1: Tableau de chaînes simples');
  console.log('spells:', testCard1.spells);
  console.log('tags:', testCard1.tags);
  
  try {
    await saveCard(testCard1);
    console.log('Test 1 réussi');
  } catch (error) {
    console.error('Test 1 échoué:', error);
  }
  
  // Cas 2: Objets avec toString() surchargé
  class SpellWithToString {
    id: string;
    name: string;
    
    constructor(id: string, name: string) {
      this.id = id;
      this.name = name;
    }
    
    toString(): string {
      return this.id;
    }
  }
  
  class TagWithToString {
    id: string;
    name: string;
    
    constructor(id: string, name: string) {
      this.id = id;
      this.name = name;
    }
    
    toString(): string {
      return this.id;
    }
  }
  
  // Création d'une carte avec des objets complexes
  const testCard2: any = {  // Using 'any' to bypass TypeScript checks for this test
    id: 'test-card-2',
    name: 'Test Card 2',
    description: 'Test description',
    type: 'personnage',
    rarity: 'banger',
    health: 10,
    image: '',
    spells: [
      new SpellWithToString('spell1', 'Spell 1'),
      new SpellWithToString('spell2', 'Spell 2')
    ],
    tags: [
      new TagWithToString('tag1', 'Tag 1'),
      new TagWithToString('tag2', 'Tag 2')
    ],
    isWIP: true
  };
  
  console.log('Test 2: Objets avec toString()');
  console.log('spells:', testCard2.spells);
  console.log('tags:', testCard2.tags);
  
  try {
    await saveCard(testCard2 as Card);
    console.log('Test 2 réussi');
  } catch (error) {
    console.error('Test 2 échoué:', error);
  }

  // Cas 3: Objets JSON complexes
  const testCard3: any = {
    id: 'test-card-3',
    name: 'Test Card 3',
    description: 'Test description',
    type: 'personnage',
    rarity: 'banger',
    health: 10,
    image: '',
    spells: [
      { id: 'spell1', name: 'Spell 1' },
      { id: 'spell2', name: 'Spell 2' }
    ],
    tags: [
      { id: 'tag1', name: 'Tag 1' },
      { id: 'tag2', name: 'Tag 2' }
    ],
    isWIP: true
  };
  
  console.log('Test 3: Objets JSON complexes');
  console.log('spells:', testCard3.spells);
  console.log('tags:', testCard3.tags);
  
  try {
    await saveCard(testCard3 as Card);
    console.log('Test 3 réussi');
  } catch (error) {
    console.error('Test 3 échoué:', error);
  }
  
  console.log('=== FIN DU TEST DE DIAGNOSTIC ===');
}

// Exécuter les tests si ce fichier est exécuté directement
if (require.main === module) {
  testCardSave().catch(console.error);
}