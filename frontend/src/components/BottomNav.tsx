import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Heart, User } from "lucide-react";

const tabs = [
  { path: "/", icon: MessageCircle, label: "Chat" },
  { path: "/saved", icon: Heart, label: "Guardados" },
  { path: "/profile", icon: User, label: "Perfil" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-around bg-white border-t border-gray-200 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
              isActive
                ? "text-primary-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
