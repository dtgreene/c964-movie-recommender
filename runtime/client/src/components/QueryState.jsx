import { errorMessage } from '../utils';

export const QueryState = ({ isLoading, error, children }) => {
  if (isLoading) {
    return <div className="loader my-8"></div>;
  }

  if (error) {
    return (
      <div className="bg-rose-100 text-rose-900 w-full border border-rose-900 p-2 rounded">
        Oops! Error fetching: {errorMessage(error)}
      </div>
    );
  }

  return children;
};
