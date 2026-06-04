import { Fragment } from 'react';
import { useSnapshot } from 'valtio';

import { groupByRating, userState } from 'store';
import { MovieCard } from '../MovieCard';
import { BrowseSuggestion } from '../BrowseSuggestion';

export const MyStuffTab = ({ onTabChange }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap.myStuff);
  const hasRatings = liked.length > 0 || disliked.length > 0;

  return (
    <div className="flex flex-col items-center gap-12">
      {!hasRatings && (
        <div className="mt-12 text-zinc-500 flex flex-col justify-center gap-2 text-center">
          <div className="text-xl">You haven't rated any movies yet.</div>
          <BrowseSuggestion onTabChange={onTabChange} />
        </div>
      )}
      {liked.length > 0 && (
        <div className="w-full">
          <div className="text-xl font-semibold mb-2">Liked</div>
          <div className="flex flex-wrap gap-4">
            {liked.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
      {disliked.length > 0 && (
        <div className="w-full">
          <div className="text-xl font-semibold mb-2">Disliked</div>
          <div className="flex flex-wrap gap-4">
            {disliked.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
