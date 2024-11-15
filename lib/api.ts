// lib/api.ts
import axios from 'axios';

const BASE_URL = 'https://api.themoviedb.org/3';
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const fetchTrendingMovies = async () => {
  const response = await api.get('/trending/movie/week');
  return response.data;
};

export const fetchMoviesByGenre = async (genreId: string) => {
  const response = await api.get('/discover/movie', {
    params: {
      with_genres: genreId,
    },
  });
  return response.data;
};

export const searchMovies = async (query: string) => {
  const response = await api.get('/search/movie', {
    params: {
      query,
    },
  });
  return response.data;
};

// lib/types.ts
export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface MovieResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
}