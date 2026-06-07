import { Fragment } from 'react';
import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';

import { api } from 'query';
import { groupByRating, userState } from 'store';
import { MovieCard } from '../MovieCard';
import { BrowseSuggestion } from '../BrowseSuggestion';

export const MyStuffTab = ({ isActive, onTabChange }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap.myStuff);
  const hasRatings = liked.length > 0 || disliked.length > 0;
  const movieIds = liked.map((movie) => movie.id);

  const { data, isPending, error } = useQuery({
    queryKey: ['taste', ...movieIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      liked.forEach((movie) => {
        params.append('liked', movie.id);
      });

      const response = await api.get(`/api/taste?${params}`);
      return response.data;
    },
    enabled: liked.length > 0 && isActive,
  });

  const topTerms = data?.top_terms;

  return (
    <div className="flex flex-col items-center gap-12">
      {!hasRatings && (
        <div className="mt-12 text-zinc-500 flex flex-col justify-center gap-2 text-center">
          <div className="text-xl">You haven't rated any movies yet.</div>
          <BrowseSuggestion onTabChange={onTabChange} />
        </div>
      )}
      <div className="w-full flex gap-4">
        <div className="flex flex-col items-center gap-12 flex-1">
          {liked.length > 0 && (
            <div className="w-full px-12">
              <div className="text-2xl mb-2">Liked</div>
              <div className="flex flex-wrap gap-4">
                {liked.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
          {disliked.length > 0 && (
            <div className="w-full px-12">
              <div className="text-2xl mb-2">Disliked</div>
              <div className="flex flex-wrap gap-4">
                {disliked.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </div>

        {liked.length > 0 && (
          <div>
            <div className="text-2xl mb-2">Your Top Terms</div>
            {isPending ? (
              <div className="flex justify-center my-8">
                <div className="loader" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {topTerms?.map(({ term }) => (
                  <div key={term}>{term}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
