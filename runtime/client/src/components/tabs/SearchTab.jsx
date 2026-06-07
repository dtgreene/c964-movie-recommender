import { useRef, useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from 'query';
import { cn } from 'utils';
import { MovieGrid } from '../MovieGrid';
import { QueryState } from '../QueryState';

export const SearchTab = ({ isActive }) => {
  const [params, setParams] = useState({ query: '', page: 1 });
  const queryEnabled = !!params.query && isActive;
  const { data, isPending, error } = useQuery({
    queryKey: ['search', params.query, params.page],
    queryFn: async () => {
      const options = { params: { query: params.query, page: params.page } };
      const response = await api.get('/api/search', options);

      return response.data.results;
    },
    enabled: queryEnabled,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (event.target[0].value) {
      setParams({ query: event.target[0].value, page: 1 });
    }
  };

  const noResultsMessage = `No results found for "${params.query}"`;

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-center w-full">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-4 w-full"
        >
          <input
            type="text"
            placeholder="Search movies by title"
            className="border border-zinc-300 rounded-full px-4 py-2 w-full"
          />
          <button
            type="submit"
            className="rounded-full border border-sky-600 text-sky-600 px-6 py-2 cursor-pointer hover:opacity-80 transition-opacity"
            disabled={queryEnabled && isPending}
          >
            Search
          </button>
        </form>
      </div>
      <div className="mt-6 w-full">
        {params.query ? (
          <QueryState isLoading={isPending} error={error}>
            <MovieGrid data={data} noResultsMessage={noResultsMessage} />
          </QueryState>
        ) : (
          <div className="text-xl text-zinc-500 text-center">
            Find movies you enjoy to get personalized recommendations.
          </div>
        )}
      </div>
    </div>
  );
};
