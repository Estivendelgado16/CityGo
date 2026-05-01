import { MOCK_USER, MOCK_PREFERENCES } from "../mocks/mock-sse";
import { User, Globe, Utensils, Music, MapPin, LogOut } from "lucide-react";

export default function ProfilePage() {
  const user = MOCK_USER;
  const prefs = MOCK_PREFERENCES;

  return (
    <div className="h-full overflow-y-auto">
      <header className="px-4 py-4 bg-white border-b border-gray-100">
        <h1 className="font-display text-xl font-bold text-gray-900">Mi Perfil</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* User info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={22} className="text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Globe size={14} />
            <span>{user.preferred_language === "es" ? "Español" : "English"}</span>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Mis Preferencias</h3>

          <div className="space-y-3">
            <PrefRow icon={<Utensils size={14} />} label="Cocinas" values={prefs.favorite_cuisines} />
            <PrefRow icon={<Music size={14} />} label="Vibes" values={prefs.preferred_vibes} />
            <PrefRow icon={<MapPin size={14} />} label="Zonas" values={prefs.preferred_zones} />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">Presupuesto: </span>
            <span className="text-sm font-medium text-accent-600">{prefs.budget_range}</span>
          </div>
        </div>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function PrefRow({ icon, label, values }: { icon: React.ReactNode; label: string; values: string[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{v}</span>
        ))}
      </div>
    </div>
  );
}
