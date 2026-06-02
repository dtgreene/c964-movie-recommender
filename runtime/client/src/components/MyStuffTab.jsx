import { Fragment } from 'react';
import { useSnapshot } from 'valtio';

import { groupByRating, userState } from '../store';
import { MovieThumbnail } from './MovieThumbnail';

export const MyStuffTab = ({ onTabChange }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const hasRatings = liked.length > 0 || disliked.length > 0;

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
    <div className="flex flex-col items-center gap-12">
      {!hasRatings && (
        <div className="mt-12 text-zinc-500 flex flex-col justify-center gap-2 text-center">
          <div className="text-xl">You haven't rated any movies yet.</div>
          <div>
            Browse {popularButton} or {searchButton} to find movies to rate.
          </div>
        </div>
      )}
      {liked.length > 0 && (
        <div className="w-full">
          <div className="text-xl font-semibold mb-2">Liked</div>
          <div className="flex flex-wrap gap-4">
            {liked.map((movie) => (
              <MovieThumbnail key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
      {disliked.length > 0 && (
        <div className="w-full">
          <div className="text-xl font-semibold mb-2">Disliked</div>
          <div className="flex flex-wrap gap-4">
            {disliked.map((movie) => (
              <MovieThumbnail key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
