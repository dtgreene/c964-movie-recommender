import { cn } from 'utils';
import { MovieCard } from './MovieCard';

export const MovieGrid = ({ data, noResultsMessage, disableRating }) => {
  const hasResults = data && data.length > 0;

  if (!hasResults) {
    if (noResultsMessage) {
      return <div className="my-8">{noResultsMessage}</div>;
    }

    return null;
  }

  return (
    <div
      className={cn('flex flex-wrap justify-center gap-4 px-12', {
        'justify-start': (data?.length ?? 0) < 5,
      })}
    >
      {data?.map((movie) => (
        <MovieCard key={movie.id} movie={movie} disableRating={disableRating} />
      ))}
    </div>
  );
};
