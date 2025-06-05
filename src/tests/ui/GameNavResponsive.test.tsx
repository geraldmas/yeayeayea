/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';
import GameNav from '../../components/ui/GameNav';
import { MemoryRouter } from 'react-router-dom';

const setupWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
};

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: window.innerWidth <= 480,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as any));
});

describe('GameNav responsive behaviour', () => {
  it('renders mobile menu button on small screens', () => {
    setupWidth(480);
    const { container } = render(
      <MemoryRouter>
        <GameNav user={{ username: 'test' }} onLogout={() => {}} />
      </MemoryRouter>
    );
    expect(container.querySelector('.mobile-menu-btn')).toBeTruthy();
    expect(container.querySelector('.game-nav-links')).toBeNull();
  });

  it('shows nav links on large screens', () => {
    setupWidth(1024);
    const { container } = render(
      <MemoryRouter>
        <GameNav user={{ username: 'test' }} onLogout={() => {}} />
      </MemoryRouter>
    );
    expect(container.querySelector('.game-nav-links')).toBeTruthy();
  });
});
