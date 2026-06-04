import { MovieCard } from './MovieCard';

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
    <div className="flex flex-wrap gap-4 ml-2">
      {data?.map((movie) => (
        <MovieCard key={movie.id} movie={movie} disableRating={disableRating} />
      ))}
    </div>
  );
};
