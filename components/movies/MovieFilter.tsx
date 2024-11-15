// components/movies/MovieFilter.tsx
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
  import { Checkbox } from "@/components/ui/checkbox";
  
  interface Genre {
    id: number;
    name: string;
  }
  
  const genres: Genre[] = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
  ];
  
  interface MovieFilterProps {
    selectedGenres: number[];
    onGenreChange: (genreId: number) => void;
  }
  
  const MovieFilter = ({ selectedGenres, onGenreChange }: MovieFilterProps) => {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="genres">
          <AccordionTrigger className="text-lg font-semibold">
            Genres
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {genres.map((genre) => (
                <div key={genre.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre.id}`}
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={() => onGenreChange(genre.id)}
                  />
                  <label
                    htmlFor={`genre-${genre.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
  
        <AccordionItem value="years">
          <AccordionTrigger className="text-lg font-semibold">
            Release Year
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[2024, 2023, 2022, 2021, 2020].map((year) => (
                <div key={year} className="flex items-center space-x-2">
                  <Checkbox id={`year-${year}`} />
                  <label
                    htmlFor={`year-${year}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {year}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
  
        <AccordionItem value="ratings">
          <AccordionTrigger className="text-lg font-semibold">
            Rating
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["8+ Rating", "7+ Rating", "6+ Rating", "5+ Rating"].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <Checkbox id={`rating-${rating}`} />
                  <label
                    htmlFor={`rating-${rating}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {rating}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };
  
  export default MovieFilter;