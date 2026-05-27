export type Vibe = "rumba" | "gastro" | "cultura" | "deporte" | "naturaleza" | "café";

export type Place = {
  id: string;
  name: string;
  category: string;
  neighborhood: string;
  priceLevel: 1 | 2 | 3;
  rating: number;
  vibes: Vibe[];
  image: string;
  description: string;
};

export const PLACES: Place[] = [
  {
    id: "1",
    name: "Salón Amador",
    category: "Discoteca",
    neighborhood: "El Poblado",
    priceLevel: 3,
    rating: 4.7,
    vibes: ["rumba"],
    image:
      "https://images.unsplash.com/photo-1571266028243-d220c64ddf60?w=800&q=80&auto=format&fit=crop",
    description:
      "Rooftop con techno y house, vista 360 al valle. La rumba más exclusiva de El Poblado.",
  },
  {
    id: "2",
    name: "Carmen",
    category: "Restaurante de autor",
    neighborhood: "El Poblado",
    priceLevel: 3,
    rating: 4.9,
    vibes: ["gastro"],
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop",
    description:
      "Cocina contemporánea colombiana con producto local. Menú degustación memorable.",
  },
  {
    id: "3",
    name: "Comuna 13 Graffiti Tour",
    category: "Cultura urbana",
    neighborhood: "San Javier",
    priceLevel: 1,
    rating: 4.8,
    vibes: ["cultura"],
    image:
      "https://images.unsplash.com/photo-1592486058517-36236ba2473d?w=800&q=80&auto=format&fit=crop",
    description:
      "Recorrido por las escaleras eléctricas y murales que cuentan la historia de la transformación.",
  },
  {
    id: "4",
    name: "Pergamino Café",
    category: "Café de especialidad",
    neighborhood: "El Poblado",
    priceLevel: 1,
    rating: 4.8,
    vibes: ["café", "gastro"],
    image:
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80&auto=format&fit=crop",
    description: "El café paisa de origen llevado a su máxima expresión. Patio interior precioso.",
  },
  {
    id: "5",
    name: "Parque Arví",
    category: "Naturaleza",
    neighborhood: "Santa Elena",
    priceLevel: 1,
    rating: 4.6,
    vibes: ["naturaleza", "deporte"],
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&auto=format&fit=crop",
    description: "Bosque nativo accesible en Metrocable. Senderos, mercados y aire puro.",
  },
  {
    id: "6",
    name: "Vintrash Bar",
    category: "Bar bohemio",
    neighborhood: "Provenza",
    priceLevel: 2,
    rating: 4.5,
    vibes: ["rumba", "cultura"],
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80&auto=format&fit=crop",
    description: "Cocteles creativos, música en vivo y la mejor terraza de Provenza.",
  },
];

export const VIBE_META: Record<Vibe, { label: string; emoji: string; color: string }> = {
  rumba:      { label: "Rumba",      emoji: "🪩", color: "magenta" },
  gastro:     { label: "Gastronomía", emoji: "🍽️", color: "coral" },
  cultura:    { label: "Cultura",    emoji: "🎨", color: "coral" },
  deporte:    { label: "Deporte",    emoji: "🚵", color: "jungle" },
  naturaleza: { label: "Naturaleza", emoji: "🌿", color: "jungle" },
  café:       { label: "Café",       emoji: "☕", color: "coral" },
};

export const LANGUAGES = [
  { code: "es", label: "Español", flag: "🇨🇴" },
  { code: "en", label: "English", flag: "🇺🇸" },
];
