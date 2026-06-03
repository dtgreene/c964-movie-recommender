import { MovieThumbnail } from './MovieThumbnail';

export const MovieGrid = ({
  data,
  noResultsMessage = 'Nothing found!',
  disableRating,
}) => {
  const hasResults = data && data.length > 0;

  if (!hasResults) {
    <div className="my-8">{noResultsMessage}</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {data?.map((movie) => (
        <MovieThumbnail
          key={movie.id}
          movie={movie}
          disableRating={disableRating}
        />
      ))}
    </div>
  );
};
