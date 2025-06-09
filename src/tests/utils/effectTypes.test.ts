import { effectTypes } from '../../utils/effectTypes';

describe('effectTypes', () => {
  it('contains expected effect definitions', () => {
    const damage = effectTypes.find(e => e.value === 'damage');
    const heal = effectTypes.find(e => e.value === 'heal');
    expect(damage).toBeTruthy();
    expect(heal).toBeTruthy();
    expect(damage?.needsTarget).toBe(true);
    expect(heal?.needsValue).toBe(true);
  });
});
