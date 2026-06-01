import { useSnapshot } from 'valtio';

import { groupByRating, userState } from '../store';

export const RecommendationsTab = () => {
  const userSnap = useSnapshot(userState);
  const { liked, disliked } = groupByRating(userSnap);
  const totalRatings = liked.length + disliked.length;
  const movieIds = liked
    .map((movie) => movie.id)
    .concat(disliked.map((movie) => movie.id));

  const { data, isPending } = useQuery({
    queryKey: ['recommendations', ...movieIds],
    queryFn: async () => {
      const params = new URLSearchParams(movieIds.map((id) => ['id', id]));
      const response = await axios.get(`/api/recommendations?${params}`);
      return response.data;
    },
    enabled: totalRatings < 5,
  });
};
