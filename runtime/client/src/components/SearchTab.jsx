import { useRef, useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { cn } from '../utils';
import { MovieResults } from './MovieResults';

/**
 * Show a score gauging how sharp the user's signal is. Something like weak,
 * medium, strong. A natural measure is the average pairwise cosine similarity
 * among their liked vectors. If all their liked movies cluster tightly in
 * vector space, the signal is strong (they have a consistent taste). If the
 * vectors are scattered, the signal is weak (eclectic taste, recommendations
 * will be less targeted)
 */

/**
 * Allow disliking/ignoring movies. This can be factored into the recommedation
 * calculation to negatively influence certain movies.
 */

export const SearchTab = ({ isActive }) => {
  const [params, setParams] = useState({ query: '', page: 1 });

  const { data, isPending } = useQuery({
    queryKey: ['search', params.query, params.page],
    queryFn: async () => {
      const options = { params: { query: params.query, page: params.page } };
      const response = await axios.get('/api/search', options);

      return response.data.results;
    },
    enabled: !!params.query && isActive,
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
          className="flex items-center gap-2 w-full"
        >
          <input
            type="text"
            placeholder="Search movies by title"
            className="border border-zinc-400 rounded-full px-4 py-2 w-full"
          />
          <button
            type="submit"
            className="rounded-full border border-sky-600 text-sky-600 px-6 py-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            Search
          </button>
        </form>
      </div>
      <div className="mt-6">
        {params.query ? (
          <MovieResults
            data={data}
            isLoading={isPending}
            noResultsMessage={noResultsMessage}
          />
        ) : (
          <div className="my-8 text-xl text-zinc-500">
            Find movies you enjoy to get personalized recommendations.
          </div>
        )}
      </div>
    </div>
  );
};
