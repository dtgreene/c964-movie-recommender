import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { MovieResults } from './MovieResults';
import { cn } from '../utils';
import { BinarySwitch } from './BinarySwitch';

export const PopularTab = ({ isActive }) => {
  const [params, setParams] = useState({ key: 'trending', page: 1 });
  const { data, isPending, error } = useQuery({
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
      <div className="mt-6">
        <MovieResults data={data} isLoading={isPending} error={error} />
      </div>
    </div>
  );
};
