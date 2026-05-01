import PlaceCard from "../components/PlaceCard";
import { MOCK_SAVED_PLACES } from "../mocks/mock-sse";
import { Heart } from "lucide-react";

export default function SavedPage() {
  const savedPlaces = MOCK_SAVED_PLACES;

  return (
    <div className="h-full overflow-y-auto">
      <header className="px-4 py-4 bg-white border-b border-gray-100">
        <h1 className="font-display text-xl font-bold text-gray-900">Mis Guardados</h1>
        <p className="text-sm text-gray-400 mt-0.5">{savedPlaces.length} lugares</p>
      </header>

      <div className="px-4 py-3">
        {savedPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Heart size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Aún no has guardado lugares. Toca el corazón en las recomendaciones del chat.
            </p>
          </div>
        ) : (
          savedPlaces.map((saved) => (
            <PlaceCard key={saved.place_id} place={saved.place} />
          ))
        )}
      </div>
    </div>
  );
}
