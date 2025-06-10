/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';
import SynergyIndicator, { SynergyEffect } from '../../components/SynergyIndicator';

describe('SynergyIndicator', () => {
  it('renders one icon per effect', () => {
    const effects: SynergyEffect[] = [
      { value: 5, source: 'Synergie: A avec B', isPercentage: true },
      { value: 2, source: 'Synergie: C avec D', isPercentage: false },
    ];
    const { container } = render(<SynergyIndicator effects={effects} />);
    expect(container.querySelectorAll('.synergy-icon').length).toBe(2);
  });
});
