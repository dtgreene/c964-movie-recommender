import { cn } from 'utils';
import { MovieCardSlim } from './MovieCardSlim';

export const MovieGrid = ({
  data,
  noResultsMessage = 'Nothing found!',
  disableRating,
}) => {
  const hasResults = data && data.length > 0;

  if (!hasResults) {
    return <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div
      className={cn('flex flex-wrap justify-center gap-4 px-12', {
        'justify-start': (data?.length ?? 0) < 5,
      })}
    >
      {data?.map((movie) => (
        <MovieCardSlim
          key={movie.id}
          movie={movie}
          disableRating={disableRating}
        />
      ))}
    </div>
  );
};
