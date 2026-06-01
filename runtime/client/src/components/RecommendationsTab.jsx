import { useSnapshot } from 'valtio';
import { useQuery } from '@tanstack/react-query';

import { groupByRating, userState } from '../store';

export const RecommendationsTab = ({ isActive }) => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const movieIds = liked
    .map((movie) => movie.id)
    .concat(disliked.map((movie) => movie.id));

  const { data, isPending } = useQuery({
    queryKey: ['recommendations', ...movieIds],
    queryFn: async () => {
      const params = new URLSearchParams();
      liked.forEach((movie) => {
        params.set('l', movie.id);
      });
      disliked.forEach((movie) => {
        params.set('d', movie.id);
      });
      const response = await axios.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: movieIds.length >= 5 && isActive,
  });
};
