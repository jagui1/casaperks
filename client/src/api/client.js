import axios from 'axios';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: false
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

