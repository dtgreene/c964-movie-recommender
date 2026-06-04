import { errorMessage } from 'utils';

export const QueryState = ({ isLoading, error, children }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="loader" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center">
        <div className="bg-rose-100 text-rose-900 border border-rose-900 p-2 rounded w-full">
          Oops! Error fetching: {errorMessage(error)}
        </div>
      </div>
    );
  }

  return children;
};
