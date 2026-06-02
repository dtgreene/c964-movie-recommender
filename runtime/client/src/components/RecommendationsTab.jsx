import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import { groupByRating, userState } from '../store';
import { MovieResults } from './MovieResults';

export const RecommendationsTab = ({ isActive }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const movieIds = liked.concat(disliked).map((movie) => movie.id);

  const { data, isPending, error } = useQuery({
    queryKey: ['recommendations', ...movieIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      liked.forEach((movie) => {
        params.append('liked', movie.id);
      });
      disliked.forEach((movie) => {
        params.append('disliked', movie.id);
      });
      const response = await axios.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: liked.length >= 5 && isActive,
  });

  return (
    <div className="flex flex-col items-center">
      <MovieResults data={data?.results} isLoading={isPending} error={error} />
    </div>
  );
};
