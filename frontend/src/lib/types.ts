export type DbPlace = {
  id: string;
  slug: string;
  name: string;
  type: "restaurant" | "bar" | "club" | "cafe" | "museum" | "event" | "park" | "viewpoint" | "shop" | "tour" | "other";
  category: string | null;
  neighborhood: string | null;
  description: string | null;
  image_url: string | null;
  price_level: number;
  rating: number;
  vibes: string[];
  maps_url: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  phone: string | null;
  is_event: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export const TYPE_LABEL: Record<DbPlace["type"], string> = {
  restaurant: "Restaurante",
  bar: "Bar",
  club: "Discoteca",
  cafe: "Café",
  museum: "Museo",
  event: "Evento",
  park: "Parque",
  viewpoint: "Mirador",
  shop: "Tienda",
  tour: "Tour",
  other: "Lugar",
};
