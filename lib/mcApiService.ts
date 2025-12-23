import { appConfig } from './config';

class McApiService {
  private baseUrl: string;
  private token: string | null;

  constructor() {
    this.baseUrl = appConfig.MC_URL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  private getHeaders(additionalHeaders?: Record<string, string>) {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...additionalHeaders,
    };
  }

  async get(endpoint: string, options?: { headers?: Record<string, string> }) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(options?.headers),
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }

  async post(endpoint: string, data: any, options?: { headers?: Record<string, string> }) {
    const isFormData = data instanceof FormData;
    const headers = this.getHeaders(options?.headers);

    if (isFormData) {
      delete (headers as any)['Content-Type'];
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: isFormData ? data : JSON.stringify(data),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json(); // Attempt to parse the error response
      } catch {
        errorBody = { message: "An unknown error occurred" }; // Fallback to a default error message
      }
      throw {
        message: errorBody.message || 'API request failed', // Use the error message from the response or a default message
        response: errorBody,
        status: response.status // Include HTTP status code for better debugging
      }; // Ensure response is included
    }

    return response.json();
  }

  async patch(endpoint: string, data: any, options?: { headers?: Record<string, string> }) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: "An unknown error occurred" };
      }
      throw {
        message: errorBody.message || 'API request failed',
        response: errorBody,
        status: response.status,
      };
    }

    return response.json();
  }

  async delete(endpoint: string, options?: { body?: any; headers?: Record<string, string> }) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: "An unknown error occurred" };
      }
      throw {
        message: errorBody.message || 'API request failed',
        response: errorBody,
        status: response.status,
      };
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
    const date = new Date();
    date.setTime(date.getTime() + (24 * 60 * 60 * 1000)); // 24 hours in milliseconds
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `token=${token}; path=/; ${expires}`;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
}

export const mcApiService = new McApiService();