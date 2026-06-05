import { Outlet } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from 'query';

export const AppLayout = () => (
  <QueryClientProvider client={queryClient}>
    <div className="flex justify-center">
      <div className="max-w-280 flex-1">
        <Outlet />
      </div>
    </div>
  </QueryClientProvider>
);
