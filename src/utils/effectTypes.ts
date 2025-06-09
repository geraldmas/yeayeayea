export interface EffectTypeDefinition {
  value: 'damage' | 'heal' | 'draw' | 'resource' | 'add_tag' | 'multiply_damage' | 'apply_alteration' | 'special';
  label: string;
  color: string;
  needsValue: boolean;
  needsTarget: boolean;
  help: string;
}

export const effectTypes: EffectTypeDefinition[] = [
  { value: 'damage', label: '⚔️ Dégâts', color: '#ffebee', needsValue: true, needsTarget: true, help: "Inflige des dégâts à la cible" },
  { value: 'heal', label: '💚 Soin', color: '#e8f5e9', needsValue: true, needsTarget: true, help: "Soigne la cible" },
  { value: 'draw', label: '🃏 Piocher', color: '#e3f2fd', needsValue: true, needsTarget: false, help: "Pioche des cartes" },
  { value: 'resource', label: '⚡ Ressource', color: '#e0f2f1', needsValue: true, needsTarget: true, help: "Génère ou coûte de la ressource" },
  { value: 'apply_alteration', label: '🔄 Appliquer altération', color: '#d1c4e9', needsValue: false, needsTarget: true, help: "Applique une altération spécifique" },
  { value: 'add_tag', label: '🏷️ Ajouter tag', color: '#e8eaf6', needsValue: false, needsTarget: true, help: "Ajoute un tag à la cible" },
  { value: 'multiply_damage', label: '✖️ Multiplier dégâts', color: '#ffecb3', needsValue: true, needsTarget: false, help: "Multiplie les dégâts" },
  { value: 'special', label: '✨ Effet spécial', color: '#fce4ec', needsValue: false, needsTarget: false, help: "Effet personnalisé" },
];
