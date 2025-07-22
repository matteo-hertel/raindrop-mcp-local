/**
 * Raindrop.io API Client
 */

import { API_BASE_URL } from './constants';

export class RaindropAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'RaindropAPIError';
  }
}

export class RaindropAPI {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token?: string) {
    this.baseUrl = API_BASE_URL;
    this.token = token || process.env.RAINDROP_TOKEN || '';

    if (!this.token) {
      throw new Error(
        'Raindrop API token is required. Set RAINDROP_TOKEN environment variable or pass token to constructor.'
      );
    }
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'raindrop-mcp-server/0.1.0',
    };
  }

  /**
   * Make HTTP request to Raindrop API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Check if the API returned an error
      if (!response.ok || data.result === false) {
        const errorMessage =
          data.errorMessage ||
          data.error ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new RaindropAPIError(errorMessage, response.status, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof RaindropAPIError) {
        throw error;
      }

      // Network or other errors
      throw new RaindropAPIError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.get('/user');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the current API token (masked for security)
   */
  getMaskedToken(): string {
    if (this.token.length <= 8) {
      return '***';
    }
    return `${this.token.slice(0, 4)}...${this.token.slice(-4)}`;
  }
}

/**
 * Default API client instance
 * Uses RAINDROP_TOKEN environment variable
 */
export const apiClient = new RaindropAPI();
