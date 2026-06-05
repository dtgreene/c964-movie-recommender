import { useRouteError } from 'react-router';

import { errorMessage } from 'utils';

export const ErrorFallback = () => {
  const error = useRouteError();

  return (
    <div className="flex justify-center">
      <div className="max-w-280 flex-1 flex flex-col items-center my-12">
        <div className="text-4xl">Oops!</div>
        <img src="fric.gif" />
        <div className="text-lg">The page crashed...</div>
        <div className="text-zinc-600">Error: {errorMessage(error)}</div>
      </div>
    </div>
  );
};
