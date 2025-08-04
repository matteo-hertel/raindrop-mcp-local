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

  /**
   * Make HTTP request with full response details
   * Returns response data, headers, and status code
   */
  async requestWithDetails(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: any; headers: Record<string, string>; status: number }> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      redirect: 'manual', // Don't follow redirects automatically
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Convert Headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;

      if (response.status === 307) {
        // For redirects, return minimal data with redirect flag
        data = { redirect: true };
      } else if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        data,
        headers,
        status: response.status,
      };
    } catch (error) {
      throw new RaindropAPIError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get document file for a raindrop (for document type raindrops)
   * Returns the file content as base64 or throws an error
   */
  async getDocumentFile(raindropId: number): Promise<{
    content: string; // base64 encoded
    contentType: string;
    size: number;
  }> {
    const fileEndpoint = `https://api.raindrop.io/rest/v1/raindrop/${raindropId}/file`;
    
    const response = await fetch(fileEndpoint, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'User-Agent': 'raindrop-mcp-server/0.1.0'
      },
      redirect: 'manual'
    });

    if (response.status === 307) {
      const signedUrl = response.headers.get('location');
      
      if (signedUrl && signedUrl.includes('amazonaws.com')) {
        // Download the file from the signed URL
        const downloadResponse = await fetch(signedUrl);
        
        if (downloadResponse.ok) {
          const arrayBuffer = await downloadResponse.arrayBuffer();
          const contentType = downloadResponse.headers.get('content-type') || 'application/octet-stream';
          const base64Content = Buffer.from(arrayBuffer).toString('base64');
          
          return {
            content: base64Content,
            contentType,
            size: arrayBuffer.byteLength
          };
        } else {
          throw new RaindropAPIError(`Failed to download document: ${downloadResponse.status} ${downloadResponse.statusText}`);
        }
      } else {
        throw new RaindropAPIError('Could not get signed URL for document download');
      }
    } else {
      throw new RaindropAPIError(`Unexpected response from file endpoint: ${response.status}`);
    }
  }

  /**
   * Get cached content for a raindrop (for non-document type raindrops)
   * Returns the cached HTML content as a string or throws an error
   */
  async getCachedContent(raindropId: number): Promise<string> {
    const cacheEndpoint = `/raindrop/${raindropId}/cache`;
    
    // Use requestWithDetails to handle the 307 redirect
    const response = await this.requestWithDetails(cacheEndpoint);
    
    if (response.status === 307) {
      const signedUrl = response.headers.location;
      
      if (signedUrl) {
        // Follow the redirect to get the cached content
        const downloadResponse = await fetch(signedUrl);
        
        if (downloadResponse.ok) {
          const content = await downloadResponse.text();
          return content;
        } else {
          throw new RaindropAPIError(`Failed to retrieve cached content: ${downloadResponse.status} ${downloadResponse.statusText}`);
        }
      } else {
        throw new RaindropAPIError('Could not get signed URL for cached content');
      }
    } else {
      throw new RaindropAPIError(`Unexpected response from cache endpoint: ${response.status}`);
    }
  }
}

/**
 * Default API client instance
 * Uses RAINDROP_TOKEN environment variable
 */
export const apiClient = new RaindropAPI();
