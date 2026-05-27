import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-medical-teal flex items-center justify-center p-4">
      <div className="text-center text-white">
        <AlertCircle className="w-20 h-20 mx-auto mb-4 opacity-80" />
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <p className="text-xl text-white/80 mb-6">Página no encontrada</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-all">
          <Home className="w-5 h-5" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
