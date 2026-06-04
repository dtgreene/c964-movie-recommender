import { useSnapshot } from 'valtio';
import abbreviate from 'number-abbreviate';

import { userState } from 'store';
import { MoviePoster } from './MoviePoster';

export const RecommendationsList = ({
  data,
  noResultsMessage = 'Nothing found!',
}) => {
  const hasResults = data && data.length > 0;
  const userSnap = useSnapshot(userState);

  if (!hasResults) {
    <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {data?.map((movie) => {
        const similarTo = userSnap.myStuff[movie._similar_to]?.movie;
        const similarTitle = similarTo?.title;

        return (
          <div
            key={movie.id}
            className="border border-zinc-300 shadow-lg shadow-zinc-300 rounded overflow-hidden flex xl:w-146 w-full"
          >
            <MoviePoster
              posterPath={movie.poster_path}
              className="w-44 aspect-2/3 shrink-0"
            />
            <div className="p-4 flex flex-col gap-2">
              <div>
                <a
                  className="line-clamp-2 hover:underline cursor-pointer inline text-2xl"
                  href={`https://www.themoviedb.org/movie/${movie.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="font-semibold">{movie.title}</span>{' '}
                  {movie.release_date && (
                    <span>({new Date(movie.release_date).getFullYear()})</span>
                  )}
                </a>
              </div>
              <div className="line-clamp-4">{movie.overview}</div>
              <div>
                <div className="flex gap-1">
                  <span>IMDb rating:</span>
                  <span className="font-semibold">{movie._imdb_rating}</span>
                  <span>({abbreviate(movie._imdb_rating_count)})</span>
                </div>
                {similarTitle && (
                  <div className="flex gap-1">
                    <span>Similar to:</span>
                    <a
                      className="font-semibold hover:underline cursor-pointer inline"
                      href={`https://www.themoviedb.org/movie/${movie._similar_to}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {similarTitle}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
