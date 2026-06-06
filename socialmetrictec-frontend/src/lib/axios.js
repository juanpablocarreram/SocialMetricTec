import axios from 'axios';

// Creamos la instancia apuntando a tu FastAPI
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // <-- CRUCIAL: Permite el envío y recepción de cookies
});

// 1. INTERCEPTOR DE PETICIONES: Inyecta el Access Token en cada llamada
api.interceptors.request.use(
  (config) => {
    // Sacas el token de donde lo tengas guardado (localStorage, contexto, etc.)
    const token = localStorage.getItem('token'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. INTERCEPTOR DE RESPUESTAS: Atrapa los errores 401 y refresca la sesión
api.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, déjala pasar
  async (error) => {
    const originalRequest = error.config;

    // Si el backend responde 401 y no hemos intentado refrescar esta petición aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Marcamos la petición para evitar bucles infinitos

      try {
        // Llamamos al endpoint de refresco. 
        // El navegador mandará la cookie 'refresh_token' solita por debajo de la mesa
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/refresh`,
          {},
          { withCredentials: true }
        );

        const { access_token } = response.data;

        // Guardamos el nuevo Access Token
        localStorage.setItem('token', access_token);

        // Actualizamos el header de la petición que había fallado originalmente
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // Reintentamos la petición original con el nuevo token y regresamos el resultado
        return api(originalRequest);

      } catch (refreshError) {
        // Si el refresh token también expiró o es inválido, el usuario debe loguearse de nuevo
        console.error("El Refresh Token también expiró. Redirigiendo al login...");
        localStorage.removeItem('token');
        
        // Aquí puedes redirigir al login (ej. window.location.href = '/login')
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;