import { MoviePoster } from './MoviePoster';

export const RecommendationsList = ({
  data,
  noResultsMessage = 'Nothing found!',
}) => {
  const hasResults = data && data.length > 0;

  if (!hasResults) {
    <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div className="flex flex-wrap">
      {data?.map((movie) => (
        <div
          key={movie.id}
          className="border border-zinc-300 shadow-lg shadow-zinc-300 rounded overflow-hidden flex w-1/2"
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
            <div className="line-clamp-3">{movie.overview}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
