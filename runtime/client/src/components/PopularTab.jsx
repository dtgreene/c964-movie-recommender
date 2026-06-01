import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { MovieResults } from './MovieResults';
import { cn } from '../utils';

export const PopularTab = ({ isActive }) => {
  const [params, setParams] = useState({ key: 'trending', page: 1 });
  const { data, isPending } = useQuery({
    queryKey: [params.key],
    queryFn: async () => {
      const response = await axios.get(`/api/${params.key}`);
      return response.data.results;
    },
    enabled: isActive,
  });

  const isTrending = params.key === 'trending';

  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-full bg-zinc-200 p-1">
        <div
          className={cn(
            'rounded-full w-26 h-8 px-2 py-1 absolute bg-sky-600 top-1 left-1 pointer-events-none transition-transform duration-200',
            { 'translate-x-26': !isTrending },
          )}
        ></div>
        <button
          className={cn('w-26 h-8 px-2 py-1 cursor-pointer relative', {
            'text-white': isTrending,
          })}
          onClick={() => setParams({ ...params, key: 'trending' })}
        >
          Trending
        </button>
        <button
          className={cn('w-26 h-8 px-2 py-1 cursor-pointer relative', {
            'text-white': !isTrending,
          })}
          onClick={() => setParams({ ...params, key: 'top_rated' })}
        >
          Top Rated
        </button>
      </div>
      <div className="mt-6">
        <MovieResults data={data} isLoading={isPending} />
      </div>
    </div>
  );
};
