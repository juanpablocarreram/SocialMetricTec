import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import PasswordInput from '../components/PasswordInput';
import LogoSVG from '../components/LogoSVG';

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
      const params = new URLSearchParams({
        username: formData.username,
        password: formData.password,
      });
      const loginRes = await api.post(`${import.meta.env.VITE_API_URL}/user/login`, params);
      console.log("Usuario autenticado:", loginRes.data);
      const { access_token } = loginRes.data;
      localStorage.setItem("token", access_token);

      const userRes = await api.get(`${import.meta.env.VITE_API_URL}/user/me`);
      setUser(userRes.data);
      setLoading(false);
      // delay para que React procese el cambio de estado antes de navegar y evitar conflictos con Framer Motion
      setTimeout(() => {
        navigate("/");
      }, 100);

    }
    catch (error) {
      console.error("Error en la autenticación:", error);
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

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-md space-y-8"
        >
          <div className="flex flex-col items-start gap-6">
            <motion.div initial="rest" whileHover="hover">
              <LogoSVG className="h-12 w-auto" />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
                Acceso Institucional
              </h1>
              <p className="text-on-surface-variant font-body leading-relaxed">
                Si eres un lider o el administrador, inicia sesion con tus credenciales
              </p>
            </div>
          </div>

          <LoginForm/>
          
        </div>
      </main>

      <footer className="w-full py-8 text-center border-t border-outline-variant/5">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">
          © 2026 Instituto Tecnologico de Estudios Superiores de Monterrey.
        </p>
      </footer>
    </div>
  );
}
