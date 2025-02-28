import { Tag } from '../types';

const STORAGE_KEY = 'savedTags';

export const saveTags = (tags: Tag[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
};

export const loadTags = (): Tag[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const addTag = (tag: Tag) => {
  const tags = loadTags();
  if (!tags.some(t => t.name === tag.name)) {
    tags.push(tag);
    saveTags(tags);
  }
};

export const removeTag = (tagName: string) => {
  const tags = loadTags();
  saveTags(tags.filter(t => t.name !== tagName));
};