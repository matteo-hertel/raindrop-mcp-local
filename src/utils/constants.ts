/**
 * Constants for Raindrop.io API
 */

export const API_BASE_URL = 'https://api.raindrop.io/rest/v1';

export const API_ENDPOINTS = {
  // Collections
  COLLECTIONS: '/collections',
  COLLECTION: (id: number) => `/collection/${id}`,

  // Raindrops
  RAINDROPS: (collectionId: number) => `/raindrops/${collectionId}`,
  RAINDROP: (id: number) => `/raindrop/${id}`,
  RAINDROP_COPY: (id: number) => `/raindrop/${id}/copy`,

  // Tags
  TAGS: (collectionId: number) => `/tags/${collectionId}`,
  TAG_RENAME: '/tags',
  TAG_MERGE: '/tags/merge',
  TAG_DELETE: '/tags',

  // Highlights
  HIGHLIGHTS: (id: number) => `/highlights/${id}`,
  HIGHLIGHT: (id: string) => `/highlight/${id}`,

  // User
  USER: '/user',

  // Filters
  FILTERS: (collectionId: number) => `/filters/${collectionId}`,

  // Import
  IMPORT_URL: '/import/url',
  IMPORT_FILE: '/import/file',
} as const;

export const DEFAULT_COLLECTION_ID = 0; // Unsorted collection
export const TRASH_COLLECTION_ID = -99; // Trash collection
