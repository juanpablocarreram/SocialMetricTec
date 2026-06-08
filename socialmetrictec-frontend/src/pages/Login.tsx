import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Tu contexto
import api from '../lib/axios';
import PasswordInput from '../components/PasswordInput';

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setUser, setLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Preparar los datos del formulario para FastAPI
      const params = new URLSearchParams({
        username: formData.username,
        password: formData.password,
      });
      // 2. Petición de Login usando la instancia personalizada
      // Nota: Ya no necesitas concatenar el VITE_API_URL, la instancia ya lo sabe base.
      const loginRes = await api.post(`${import.meta.env.VITE_API_URL}/user/login`, params);
      
      // Axios guarda el JSON del servidor directamente en .data
      console.log("Usuario autenticado:", loginRes.data);
      const { access_token } = loginRes.data;
      // 3. Guardar el Access Token en el localStorage
      localStorage.setItem("token", access_token);

      // 4. Obtener el perfil del usuario inmediatamente (/user/me)
      // ¡Magia! Tu interceptor de peticiones detecta el nuevo token en el localStorage 
      // y le pega el header "Authorization: Bearer ..." de forma automática.
      const userRes = await api.get(`${import.meta.env.VITE_API_URL}/user/me`);
      setUser(userRes.data);
      setLoading(false);
      // Permitir que React procese el cambio de estado antes de navegar
      // para evitar conflictos con Framer Motion
      setTimeout(() => {
        navigate("/");
      }, 100);

    } 
    catch (error) {
      // Axios maneja los errores HTTP (400, 401, 500, etc.) enviándolos directo al catch
      console.error("Error en la autenticación:", error);
      
      // El JSON de error que manda tu FastAPI (ej: HTTPException(detail="..."))
      // vive adentro de error.response.data
      const errorMsg = error.response?.data?.detail || "Error al iniciar sesión";
      
      setErrorMessage(typeof errorMsg === 'string' ? errorMsg : "Error de validación");
    } 
    finally {
      setIsSubmitting(false);
    }
};

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white p-10 rounded-2xl shadow-xl shadow-primary/5 border border-outline-variant/10 space-y-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="username" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Nombre de Usuario
          </label>
          <input
            id="username"
            required
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Noobmaster69"
            className="w-full bg-surface-container-low border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Contraseña
          </label>
          <PasswordInput
            id="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="........"
            className="w-full bg-surface-container-low border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
          />
        </div>
      </div>

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="flex items-center gap-2 bg-error/10 border border-error/30 text-error rounded-lg p-3 text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full bg-primary text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-70"
      >
        {isSubmitting ? (
          <><Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /> Iniciando sesión...</>
        ) : (
          <>Iniciar Sesión <ArrowRight aria-hidden="true" className="w-5 h-5" /></>
        )}
      </button>
    </form>
  );
};

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="w-full px-6 md:px-12 py-6 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            alt="SocialMetricTec Logo"
            className="h-10 w-auto object-contain"
            src="/logo.svg"
          />
          <span className="text-xl font-bold text-primary tracking-tighter font-headline">
            SocialMetricTec
          </span>
        </Link>
        <button
          onClick={() => navigate(-1)}
          aria-label="Regresar a la página anterior"
          className="px-6 py-2 cursor-pointer border border-primary text-primary rounded-md text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2"
        >
          Regresar
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div 
          className="w-full max-w-md space-y-8"
        >
          {/* Institutional Icon */}
          <div className="flex flex-col items-start gap-6">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-md shadow-lg">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
                Acceso Institucional
              </h1>
              <p className="text-on-surface-variant font-body leading-relaxed">
                Si eres un lider o el administrador, inicia sesion con tus credenciales
              </p>
            </div>
          </div>

          {/* Login Card */}
          <LoginForm/>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-outline-variant/5">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">
          © 2026 Instituto Tecnologico de Estudios Superiores de Monterrey.
        </p>
      </footer>
    </div>
  );
}
