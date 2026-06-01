import { Fragment } from 'react';
import { useSnapshot } from 'valtio';

import { groupByRating, userState } from '../store';
import { MovieThumbnail } from './MovieThumbnail';

export const MyStuffTab = () => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const hasRatings = liked.length > 0 || disliked.length > 0;

  return (
    <div className="flex flex-col items-center gap-12">
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
