import { errorMessage } from '../utils';
import { MovieThumbnail } from './MovieThumbnail';

export const MovieResults = ({
  data,
  noResultsMessage = 'Nothing found!',
  isLoading,
  error,
}) => {
  const hasResults = data && data.length > 0;

  if (isLoading) {
    return <div className="loader my-8"></div>;
  }

  if (error) {
    return (
      <div className="bg-rose-100 text-rose-900 w-full border border-rose-900 p-2 rounded">
        Oops! Error fetching movies: {errorMessage(error)}
      </div>
    );
  }

  if (!hasResults) {
    <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {data?.map((movie) => (
        <MovieThumbnail key={movie.id} movie={movie} />
      ))}
    </div>
  );
};
