import axios, { AxiosInstance, AxiosError } from 'axios';
import { storageKeys } from './utils';

// API Client Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(storageKeys.authToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - clear token and redirect to auth
    if (error.response?.status === 401) {
      localStorage.removeItem(storageKeys.authToken);
      console.warn('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email_address: email, password }),

    register: (email: string, password: string, username: string) =>
      apiClient.post('/auth/register', {
        user: {
          email_address: email,
          username,
          password,
          password_confirmation: password,
        },
      }),

    logout: () => apiClient.delete('/auth/logout'),
  },

  // Flows
  flows: {
    list: (params?: { since?: number; tags?: string }) =>
      apiClient.get('/flows', { params }),

    get: (id: string) =>
      apiClient.get(`/flows/${id}`),

    create: (flowData: any) =>
      apiClient.post('/flows', { items: [flowData] }),

    update: (id: string, flowData: any) =>
      apiClient.put(`/flows/${id}`, { api_flow: flowData }),

    delete: (id: string) =>
      apiClient.delete(`/flows/${id}`),
  },

  // Flow Matches
  flowMatches: {
    list: (params?: { since?: number }) =>
      apiClient.get('/flow_matches', { params }),

    get: (id: string) =>
      apiClient.get(`/flow_matches/${id}`),

    create: (matchData: any) =>
      apiClient.post('/flow_matches', matchData),

    update: (id: string, matchData: any) =>
      apiClient.put(`/flow_matches/${id}`, matchData),

    delete: (id: string) =>
      apiClient.delete(`/flow_matches/${id}`),
  },

  // Match Notes
  matchNotes: {
    list: (params?: { since?: number }) =>
      apiClient.get('/match_notes', { params }),

    create: (noteData: any) =>
      apiClient.post('/match_notes', noteData),

    update: (id: string, noteData: any) =>
      apiClient.put(`/match_notes/${id}`, noteData),

    delete: (id: string) =>
      apiClient.delete(`/match_notes/${id}`),
  },

  // Step Contents
  stepContents: {
    list: (params?: { since?: number }) =>
      apiClient.get('/step_contents', { params }),

    create: (contentData: any) =>
      apiClient.post('/step_contents', contentData),

    update: (id: string, contentData: any) =>
      apiClient.put(`/step_contents/${id}`, contentData),

    delete: (id: string) =>
      apiClient.delete(`/step_contents/${id}`),
  },

  // Flow History
  flowHistory: {
    list: (params?: { since?: number }) =>
      apiClient.get('/flow_history', { params }),

    create: (historyData: any) =>
      apiClient.post('/flow_history', historyData),
  },

  // Flow Aggregates
  flowAggregates: {
    create: (aggregateData: any) =>
      apiClient.post('/flow_aggregates', aggregateData),

    get: (id: string) =>
      apiClient.get(`/flow_aggregates/${id}`),

    update: (id: string, aggregateData: any) =>
      apiClient.put(`/flow_aggregates/${id}`, aggregateData),
  },

  // Tags
  tags: {
    list: (params?: { query?: string; page?: number; per_page?: number }) =>
      apiClient.get('/tags', { params }),

    create: (tagData: any) =>
      apiClient.post('/tags', tagData),

    update: (id: string, tagData: any) =>
      apiClient.put(`/tags/${id}`, tagData),

    delete: (id: string) =>
      apiClient.delete(`/tags/${id}`),
  },

  // Teams
  teams: {
    list: () =>
      apiClient.get('/teams'),

    get: (id: string) =>
      apiClient.get(`/teams/${id}`),

    create: (teamData: any) =>
      apiClient.post('/teams', teamData),

    update: (id: string, teamData: any) =>
      apiClient.put(`/teams/${id}`, teamData),
  },

  // Public Flows
  publicFlows: {
    list: () =>
      apiClient.get('/public/flows'),

    get: (id: string) =>
      apiClient.get(`/public/flows/${id}`),

    userFlows: ({username}: {username: string}) =>
      apiClient.get(`/users/${username}/flows`),
  },

  // Repos
  repos: {
    list: () =>
      apiClient.get('/repos'),
    get: (name: string) =>
      apiClient.get(`/repos/${name}`),
  },

  // Status
  status: () =>
    apiClient.get('/status'),
};

export default apiClient;
