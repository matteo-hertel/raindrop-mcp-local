/**
 * TypeScript interfaces for Raindrop.io API
 */

export interface Raindrop {
  _id: number;
  title: string;
  link: string;
  collection: { $id: number };
  tags: string[];
  created: string;
  lastUpdate: string;
  excerpt?: string;
  note?: string;
  important?: boolean;
  broken?: boolean;
  type?: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
  domain?: string;
  cover?: string;
  media?: Array<{
    link: string;
    type: string;
  }>;
  cache?: {
    status:
      | 'ready'
      | 'retry'
      | 'failed'
      | 'invalid-origin'
      | 'invalid-timeout'
      | 'invalid-size';
    size: number;
    created: string;
  };
  creatorRef?: number;
  sort?: number;
  highlights?: string[];
}

export interface Collection {
  _id: number;
  title: string;
  count: number;
  public: boolean;
  view: 'list' | 'simple' | 'grid' | 'masonry';
  description?: string;
  cover?: string[];
  color?: string;
  sort?: number;
  access?: {
    for: number;
    level: number;
    root: boolean;
    draggable: boolean;
  };
  collaborators?: {
    $id: number;
    fullName: string;
    email: string;
    role: string;
  }[];
  expanded?: boolean;
  creatorRef: number;
  created: string;
  lastUpdate: string;
}

export interface User {
  _id: number;
  email: string;
  fullName: string;
  pro: boolean;
  avatar?: string;
  name?: string;
  registered: string;
  lastAction?: string;
  lastVisit?: string;
  lastUpdate?: string;
  provider?: string;
  config?: {
    default_collection_view?: string;
    raindrops_hide?: string[];
    raindrops_buttons?: string[];
    raindrops_search_by_score?: boolean;
    raindrops_search_incollection?: boolean;
    broken_level?: string;
    font_size?: number;
    nested_view_legacy?: boolean;
    add_default_collection?: number;
    acknowledge?: any[];
    ai_suggestions?: boolean;
    last_collection?: number;
    tags_hide?: boolean;
  };
  groups?: Array<{
    title: string;
    hidden: boolean;
    sort: number;
    collections: number[];
  }>;
  tfa?: {
    enabled: boolean;
  };
  files?: {
    used: number;
    size: number;
    lastCheckPoint: string;
  };
  apple?: {
    enabled: boolean;
  };
}

export interface Tag {
  _id: string;
  count: number;
}

export interface Highlight {
  _id: string;
  text: string;
  note?: string;
  color: 'yellow' | 'blue' | 'red' | 'green';
  created: string;
  link: string;
  title: string;
  tags?: string[];
  raindropRef: number;
  creatorRef: number;
}

export interface ApiResponse<T> {
  result: boolean;
  items?: T[];
  item?: T;
  count?: number;
  collectionId?: number;
}

export interface ApiError {
  result: boolean;
  error: string;
  errorMessage: string;
}

// Additional request/response types
export interface CreateRaindropRequest {
  link: string;
  title?: string;
  excerpt?: string;
  note?: string;
  tags?: string[];
  important?: boolean;
  collection?: { $id: number };
  type?: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
  cover?: string;
  pleaseParse?: {
    link?: boolean;
    title?: boolean;
    excerpt?: boolean;
  };
}

export interface UpdateRaindropRequest {
  title?: string;
  excerpt?: string;
  note?: string;
  tags?: string[];
  important?: boolean;
  collection?: { $id: number };
  cover?: string;
}

export interface CreateCollectionRequest {
  title: string;
  description?: string;
  public?: boolean;
  view?: 'list' | 'simple' | 'grid' | 'masonry';
  color?: string;
  cover?: string[];
}

export interface UpdateCollectionRequest {
  title?: string;
  description?: string;
  public?: boolean;
  view?: 'list' | 'simple' | 'grid' | 'masonry';
  color?: string;
  cover?: string[];
}

export interface SearchOptions {
  search?: string;
  sort?: '-created' | '-lastUpdate' | '-sort' | 'title' | '-title';
  page?: number;
  perpage?: number;
}

export interface ImportUrlRequest {
  link: string;
  collection?: { $id: number };
  tags?: string[];
  important?: boolean;
  pleaseParse?: boolean;
}

export interface CreateHighlightRequest {
  text: string;
  note?: string;
  color: 'yellow' | 'blue' | 'red' | 'green';
  tags?: string[];
}

export interface UpdateHighlightRequest {
  text?: string;
  note?: string;
  color?: 'yellow' | 'blue' | 'red' | 'green';
  tags?: string[];
}

// Filter types for statistics
export interface Filter {
  _id: string;
  count: number;
}

export interface FilterResponse {
  tags: Filter[];
  types: Filter[];
  important: { count: number };
  broken: { count: number };
  duplicate: { count: number };
}

// URL parsing and import types
export interface ParsedUrl {
  link: string;
  title?: string;
  description?: string;
  type?: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
  domain?: string;
  cover?: string;
  meta?: {
    charset?: string;
    language?: string;
    keywords?: string[];
  };
}

export interface UrlExistsResponse {
  result: boolean;
  exists: boolean;
  link?: string;
  raindrop?: {
    _id: number;
    title: string;
    collection: { $id: number };
    created: string;
  };
}

export interface ImportFileRequest {
  html?: string;
  url?: string;
  folder?: string;
  parseOnly?: boolean;
}

export interface ImportFileResponse {
  result: boolean;
  items?: Array<{
    link: string;
    title: string;
    tags?: string[];
    note?: string;
    folder?: string;
  }>;
  count?: number;
}
