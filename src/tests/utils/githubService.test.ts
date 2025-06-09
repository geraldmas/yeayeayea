import { Octokit } from '@octokit/rest';

declare const global: any;

jest.mock('@octokit/rest', () => ({
  __esModule: true,
  Octokit: jest.fn().mockImplementation(() => ({
    repos: { getContent: jest.fn(), createOrUpdateFileContents: jest.fn() },
    users: { getAuthenticated: jest.fn() }
  }))
}));

const mockedOctokit = Octokit as unknown as jest.Mock;
let githubService: any;

beforeEach(() => {
  jest.resetModules();
  mockedOctokit.mockClear();
  global.localStorage = {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn()
  };
});

describe('githubService', () => {
  it('setToken stores token', () => {
    githubService = require('../../utils/githubService').githubService;
    githubService.setToken('abc');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('github_token', 'abc');
  });

  it('isAuthenticated returns true when API succeeds', async () => {
    const mockInstance = {
      repos: { getContent: jest.fn(), createOrUpdateFileContents: jest.fn() },
      users: { getAuthenticated: jest.fn().mockResolvedValue({}) }
    };
    mockedOctokit.mockReturnValue(mockInstance as any);
    githubService = require('../../utils/githubService').githubService;
    githubService.setToken('t');
    const result = await githubService.isAuthenticated();
    expect(result).toBe(true);
  });
});
