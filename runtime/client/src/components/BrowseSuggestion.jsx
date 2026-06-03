export const BrowseSuggestion = ({ onTabChange }) => {
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
    <div>
      Browse {popularButton} or {searchButton} to find movies to rate.
    </div>
  );
};
