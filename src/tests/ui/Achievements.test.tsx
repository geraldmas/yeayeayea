/** @jest-environment jsdom */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import Achievements from '../../components/Achievements';
import { userService } from '../../utils/userService';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../utils/userService');
jest.mock('../../utils/supabaseClient');

describe('Achievements component', () => {
  it('renders unlocked and locked achievements', async () => {
    (userService.getAchievements as jest.Mock).mockResolvedValue([{ achievements: { id: 1, name: 'A1', description: 'd', icon_url: '' } }]);
    (supabase.from as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue({ data: [{ id:1,name:'A1',description:'d'},{ id:2,name:'A2',description:'e'}], error: null }) });

    const { getByText } = render(<Achievements user={{ id: 'u' }} />);
    await waitFor(() => getByText('Réalisations'));

    expect(getByText('A1')).toBeInTheDocument();
    expect(getByText('A2')).toBeInTheDocument();
  });
});
