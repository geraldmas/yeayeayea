import { runAi } from '../aiAgent';

describe('runAi', () => {
  it('retourne le bon nombre dactions', () => {
    const feedback = runAi(3, 'easy');
    expect(feedback.actions).toHaveLength(3);
  });
});

