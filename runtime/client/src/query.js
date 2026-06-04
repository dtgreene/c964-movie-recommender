import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

export const api = axios.create({
  headers: {
    'X-API-Key': import.meta.env.VITE_SUPER_SECRET_PASSWORD_OMG,
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
