import { Routes, Route, Navigate } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  // TODO: reemplazar con auth real en semana 2
  const isOnboarded = true;

  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-cream">
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
