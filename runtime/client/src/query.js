import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

export const api = axios.create({
  headers: {
    'X-API-User': 'C964',
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});
