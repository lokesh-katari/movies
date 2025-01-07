import React, { useEffect, useState } from "react";
import { Search, Film, ChevronLeft, ChevronRight } from "lucide-react";

interface Movie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  imdbRating?: string;
}

interface MovieDetails extends Movie {
  Plot: string;
  Director: string;
  Actors: string;
  imdbRating: string;
}

interface SearchResponse {
  Search: Movie[];
  totalResults: string;
  Response: string;
}

const MovieCard: React.FC<{
  movie: Movie;
  onClick: () => void;
  isLoading: boolean;
}> = ({ movie, onClick, isLoading }) => (
  <div
    className="bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition hover:scale-105 relative"
    onClick={onClick}
  >
    <img
      src={movie.Poster !== "N/A" ? movie.Poster : "/api/placeholder/300/450"}
      alt={movie.Title}
      className="w-full h-96 object-cover"
    />
    <div className="p-4">
      <h3 className="text-xl text-white font-bold mb-2">{movie.Title}</h3>
      <p className="text-gray-300">{movie.Year}</p>
    </div>
    {isLoading && (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
  </div>
);

const MovieModal: React.FC<{
  movie: MovieDetails | null;
  onClose: () => void;
}> = ({ movie, onClose }) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ×
        </button>
        <div className="flex flex-col md:flex-row gap-6">
          <img
            src={
              movie.Poster !== "N/A" ? movie.Poster : "/api/placeholder/300/450"
            }
            alt={movie.Title}
            className="w-full md:w-64 h-96 object-cover rounded"
          />
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {movie.Title}
            </h2>
            <p className="text-gray-300 mb-4">{movie.Plot}</p>
            <div className="text-gray-400">
              <p>
                <strong>Director:</strong> {movie.Director}
              </p>
              <p>
                <strong>Actors:</strong> {movie.Actors}
              </p>
              <p>
                <strong>Rating:</strong> {movie.imdbRating}/10
              </p>
              <p>
                <strong>Year:</strong> {movie.Year}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1;
      if (currentPage <= 3) return i + 1;
      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
      return currentPage - 2 + i;
    }
  );

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>

      {pageNumbers[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
          >
            1
          </button>
          <span className="text-gray-500">...</span>
        </>
      )}

      {pageNumbers.map((num) => (
        <button
          key={num}
          onClick={() => onPageChange(num)}
          className={`px-4 py-2 rounded-lg ${
            currentPage === num
              ? "bg-blue-600"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          {num}
        </button>
      ))}

      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          <span className="text-gray-500">...</span>
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

const App = () => {
  const [query, setQuery] = useState("guardians");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const API_KEY = "3d54f056";
  const RESULTS_PER_PAGE = 10;

  const searchMovies = async (page: number = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}&page=${page}`
      );
      const data: SearchResponse = await response.json();

      if (data.Response === "True") {
        setMovies(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setCurrentPage(page);
      } else {
        setError("No movies found");
        setMovies([]);
        setTotalResults(0);
      }
    } catch (err) {
      setError("Failed to fetch movies");
      setMovies([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    searchMovies(1);
  }, []); // Initial load

  const [loadingMovieId, setLoadingMovieId] = useState<string | null>(null);

  const getMovieDetails = async (imdbID: string) => {
    setLoadingMovieId(imdbID);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}&plot=full`
      );
      const data = await response.json();

      if (data.Response === "True") {
        setSelectedMovie(data);
      }
    } catch (err) {
      console.error("Failed to fetch movie details");
    } finally {
      setLoadingMovieId(null);
    }
  };

  const handlePageChange = (page: number) => {
    searchMovies(page);
  };

  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Movie Mania</h1>

        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchMovies(1)}
              placeholder="Search for movies..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => searchMovies(1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
          >
            <Film size={20} />
            Search
          </button>
        </div>

        {loading && <div className="text-center text-gray-400">Loading...</div>}

        {error && <div className="text-center text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.imdbID}
              movie={movie}
              onClick={() => getMovieDetails(movie.imdbID)}
              isLoading={loadingMovieId === movie.imdbID}
            />
          ))}
        </div>

        {totalResults > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {selectedMovie && (
          <MovieModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
