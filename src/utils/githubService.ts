import { Octokit } from '@octokit/rest';
import { Card } from '../types';

const REPO_OWNER = 'geraldmas';
const REPO_NAME = 'yeayeayea';
const CARDS_PATH = 'public/cards';

interface GitHubFileContent {
  type: 'file';
  encoding: string;
  size: number;
  name: string;
  path: string;
  content: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
}

class GitHubService {
  private octokit: Octokit;
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('github_token');
    this.octokit = new Octokit({
      auth: this.token
    });
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('github_token', token);
    this.octokit = new Octokit({
      auth: token
    });
  }

  async saveCard(card: Card) {
    if (!this.token) {
      throw new Error('GitHub token not set');
    }

    try {
      // Get the current content of index.json
      const indexResponse = await this.octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `${CARDS_PATH}/index.json`,
      });

      let existingCards: Card[] = [];
      let indexSha: string | undefined;

      if (!Array.isArray(indexResponse.data) && indexResponse.data.type === 'file') {
        const fileContent = indexResponse.data as GitHubFileContent;
        const content = Buffer.from(fileContent.content, 'base64').toString();
        existingCards = JSON.parse(content);
        indexSha = fileContent.sha;
      }

      // Add or update the card
      const cardIndex = existingCards.findIndex(c => c.id === card.id);
      if (cardIndex >= 0) {
        existingCards[cardIndex] = card;
      } else {
        existingCards.push(card);
      }

      // Save the card file
      const cardFileName = `${card.id || Date.now()}.json`;
      await this.octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `${CARDS_PATH}/${cardFileName}`,
        message: `Update card: ${card.name}`,
        content: Buffer.from(JSON.stringify(card, null, 2)).toString('base64'),
        branch: 'main'
      });

      // Update index.json
      await this.octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `${CARDS_PATH}/index.json`,
        message: `Update cards index`,
        content: Buffer.from(JSON.stringify(existingCards, null, 2)).toString('base64'),
        ...(indexSha ? { sha: indexSha } : {}),
        branch: 'main'
      });

      return true;
    } catch (error) {
      console.error('Error saving card:', error);
      throw error;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) return false;
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }
}

export const githubService = new GitHubService();