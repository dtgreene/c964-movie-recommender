import { MovieThumbnail } from './MovieThumbnail';

export const MovieResults = ({
  data,
  noResultsMessage = 'Nothing found!',
  isLoading,
}) => {
  const hasResults = data && data.length > 0;

  if (isLoading) {
    return <div className="loader my-8"></div>;
  }

  if (!hasResults) {
    <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {data.map((movie) => (
        <MovieThumbnail key={movie.id} movie={movie} />
      ))}
    </div>
  );
};
