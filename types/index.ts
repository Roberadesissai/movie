interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  movies?: Movie[];
  timestamp: string;
} 