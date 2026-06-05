import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

import { api } from 'query';
import { QueryState } from './QueryState';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

export const MLVisuals = () => {
  const [, setSearchParams] = useSearchParams();
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const canvasRef3 = useRef(null);
  const { data, isPending, error } = useQuery({
    queryKey: ['visuals-meta'],
    queryFn: async () => {
      const response = await api.get('/api/visuals-meta');
      return response.data;
    },
  });

  useEffect(() => {
    setSearchParams({});
  }, []);

  useEffect(() => {
    if (!data) return;

    const chart1 = new Chart(canvasRef1.current, {
      type: 'bar',
      data: {
        labels: data.top_tfidf_terms.map((d) => d.term.replace(/_/g, ' ')),
        datasets: [
          {
            label: 'TF-IDF Score',
            data: data.top_tfidf_terms.map((d) => d.score),
            backgroundColor: 'rgba(251, 146, 60, 0.7)', // orange-400
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: 'Aggregate TF-IDF Score' } },
        },
      },
    });

    const chart2 = new Chart(canvasRef2.current, {
      type: 'bar',
      data: {
        labels: data.genre_distribution.slice(0, 15).map((d) => d.genre),
        datasets: [
          {
            label: 'Movies',
            data: data.genre_distribution.slice(0, 15).map((d) => d.count),
            backgroundColor: 'rgba(14, 165, 233, 0.7)', // sky-500
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { title: { display: true, text: 'Number of Movies' } } },
      },
    });

    // const chart2 = new Chart(canvasRef2.current, {
    //   type: 'bar',
    //   data: {
    //     labels: data.rating_distribution.map((d) => d.rating.toFixed(1)),
    //     datasets: [
    //       {
    //         label: 'Movies',
    //         data: data.rating_distribution.map((d) => d.count),
    //         backgroundColor: 'rgba(16, 185, 129, 0.7)', // emerald-500
    //       },
    //     ],
    //   },
    //   options: {
    //     plugins: { legend: { display: false } },
    //     scales: {
    //       x: { title: { display: true, text: 'IMDb Rating' } },
    //       y: { title: { display: true, text: 'Number of Movies' } },
    //     },
    //   },
    // });

    const chart3 = new Chart(canvasRef3.current, {
      type: 'bar',
      data: {
        labels: data.avg_rating_by_genre.slice(0, 15).map((d) => d.genre),
        datasets: [
          {
            label: 'Avg IMDb Rating',
            data: data.avg_rating_by_genre
              .slice(0, 15)
              .map((d) => d.avg_rating),
            backgroundColor: 'rgba(168, 85, 247, 0.7)', // purple-500
          },
        ],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            min: 5,
            max: 9,
            title: { display: true, text: 'Average IMDb Rating' },
          },
        },
      },
    });

    return () => {
      chart1.destroy();
      chart2.destroy();
      chart3.destroy();
    };
  }, [data]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <div className="text-2xl">Data Visualizations</div>
        <Link to="/" className="text-sky-600 hover:underline cursor-pointer">
          Return home
        </Link>
      </div>
      <QueryState isLoading={isPending} error={error}>
        <div className="flex flex-col w-full gap-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl">Top TF-IDF Terms</div>
            <canvas
              ref={canvasRef1}
              className="border rounded border-zinc-300 p-4"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl">Movies by Genre</div>
            <canvas
              ref={canvasRef2}
              className="border rounded border-zinc-300 p-4"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xl">Average IMDb Rating by Genre</div>
            <canvas
              ref={canvasRef3}
              className="border rounded border-zinc-300 p-4"
            />
          </div>
        </div>
      </QueryState>
    </div>
  );
};
