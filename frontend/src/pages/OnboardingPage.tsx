import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const navigate = useNavigate();

  // TODO: Implementar formulario multi-step completo
  // Por ahora es un placeholder para que el equipo vea la estructura

  return (
    <div className="flex flex-col h-[100dvh] bg-cream">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
          <span className="text-4xl">🏔️</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido a CityGo!
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Tu guía personal para descubrir lo mejor de Medellín. Cuéntanos qué
          te gusta para darte recomendaciones personalizadas.
        </p>

        {/* TODO: Reemplazar con formulario multi-step */}
        <div className="w-full max-w-sm space-y-3 text-left">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Próximamente: formulario de preferencias
          </p>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-sm text-gray-500 space-y-2">
            <p>• Presupuesto preferido ($, $$, $$$, $$$$)</p>
            <p>• Tipos de cocina favorita</p>
            <p>• Vibes que te gustan</p>
            <p>• Zonas preferidas</p>
            <p>• Intereses</p>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-8 w-full max-w-sm bg-primary-500 text-white font-medium py-3 rounded-2xl hover:bg-primary-600 transition-colors active:scale-[0.98]"
        >
          Empezar a explorar →
        </button>
      </div>
    </div>
  );
}
