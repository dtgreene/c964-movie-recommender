import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { groupByRating, userState } from '../store';
import { MovieResults } from './MovieResults';

export const RecommendationsTab = ({ isActive, onTabChange }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const movieIds = liked.concat(disliked).map((movie) => movie.id);
  const minLikedDelta = 5 - liked.length;
  const hasMinLiked = minLikedDelta <= 0;
  const weights = { vote: 0, popular: 0 };

  /**
   * The TMDb Popularity Score is a dynamic, daily-updated metric that measures
   * how much user attention and engagement a title is receiving on the
   * platform. You can think of it like a trending score.
   */

  const { data, isPending, error } = useQuery({
    queryKey: ['recommendations', ...movieIds, JSON.stringify(weights)],
    queryFn: async () => {
      const params = new URLSearchParams();
      liked.forEach((movie) => {
        params.append('liked', movie.id);
      });
      disliked.forEach((movie) => {
        params.append('disliked', movie.id);
      });

      params.set('imdb_vote_weight', weights.vote);
      params.set('tmdb_popular_weight', weights.popular);

      const response = await axios.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: hasMinLiked && isActive,
  });

  const popularButton = (
    <button
      className="text-sky-600 cursor-pointer hover:underline"
      onClick={() => onTabChange('popular')}
    >
      Popular
    </button>
  );

  const searchButton = (
    <button
      className="text-sky-600 cursor-pointer hover:underline"
      onClick={() => onTabChange('search')}
    >
      Search
    </button>
  );

  return (
    <div className="flex flex-col items-center">
      {hasMinLiked ? (
        <MovieResults
          data={data?.results}
          isLoading={isPending}
          error={error}
        />
      ) : (
        <div className="mt-12 text-zinc-500 flex flex-col gap-2 text-center">
          <div className="text-xl">
            Like {minLikedDelta} more movie
            {minLikedDelta !== 1 ? 's' : ''} to unlock recommendations.
          </div>
          <div>
            Browse {popularButton} or {searchButton} to find movies to rate.
          </div>
        </div>
      )}
    </div>
  );
};
