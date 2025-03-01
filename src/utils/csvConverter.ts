import { Card, Spell } from '../types';

export function convertCardsToCSV(cards: Card[]): string {
  // Définir les en-têtes du CSV
  const headers = [
    'id',
    'name',
    'description',
    'type',
    'rarity',
    'health',
    'image',
    'isEX',
    'spells',
    'talent',
    'tags'
  ].join(',');

  // Convertir chaque carte en ligne CSV
  const rows = cards.map(card => {
    const values = [
      card.id,
      `"${card.name.replace(/"/g, '""')}"`,
      `"${(card.description || '').replace(/"/g, '""')}"`,
      card.type,
      card.rarity,
      card.health,
      `"${(card.image || '').replace(/"/g, '""')}"`,
      card.isEX ? 'true' : 'false',
      `"${JSON.stringify(card.spells || []).replace(/"/g, '""')}"`,
      `"${card.talent ? JSON.stringify(card.talent).replace(/"/g, '""') : ''}"`,
      `"${JSON.stringify(card.tags || []).replace(/"/g, '""')}"`,
    ];
    return values.join(',');
  });

  // Combiner les en-têtes et les lignes
  return [headers, ...rows].join('\n');
}

export function convertCSVToCards(csv: string): Card[] {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)/g) || [];
    const card: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Nettoyer les guillemets
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      
      // Convertir les valeurs selon leur type
      switch (header) {
        case 'health':
          card[header] = parseInt(value) || 0;
          break;
        case 'isEX':
          card[header] = value === 'true';
          break;
        case 'spells':
          try {
            card[header] = JSON.parse(value || '[]').map((id: any) => typeof id === 'object' && id !== null ? id.id : id);
          } catch {
            card[header] = [];
          }
          break;
        case 'talent':
          try {
            card[header] = value ? (typeof JSON.parse(value) === 'object' && JSON.parse(value) !== null ? JSON.parse(value).id : JSON.parse(value)) : null;
          } catch {
            card[header] = null;
          }
          break;
        case 'tags':
          try {
            card[header] = JSON.parse(value || '[]').map((id: any) => typeof id === 'object' && id !== null ? id.id : id);
          } catch {
            card[header] = [];
          }
          break;
        default:
          card[header] = value;
      }
    });
    
    return card as Card;
  });
}

export function downloadCSV(cards: Card[]) {
  const csv = convertCardsToCSV(cards);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'cards.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}