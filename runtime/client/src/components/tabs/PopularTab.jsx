import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from 'query';

import { cn } from 'utils';
import { MovieGrid } from '../MovieGrid';
import { BinarySwitch } from '../BinarySwitch';
import { QueryState } from '../QueryState';

export const PopularTab = ({ isActive }) => {
  const [params, setParams] = useState({ key: 'trending', page: 1 });
  const { data, isPending, error } = useQuery({
    queryKey: [params.key],
    queryFn: async () => {
      const response = await api.get(`/api/${params.key}`);
      return response.data.results;
    },
    enabled: isActive,
  });

  const isTrending = params.key === 'trending';

  return (
    <div className="flex flex-col items-center">
      <BinarySwitch
        labelA="Trending"
        labelB="Top Rated"
        isActive={isTrending}
        onChange={(value) => {
          if (value) {
            setParams({ ...params, key: 'trending' });
          } else {
            setParams({ ...params, key: 'top_rated' });
          }
        }}
      />
      <div className="mt-6 w-full">
        <QueryState isLoading={isPending} error={error}>
          <MovieGrid data={data} noResultsMessage="Nothing found!" />
        </QueryState>
      </div>
    </div>
  );
};
