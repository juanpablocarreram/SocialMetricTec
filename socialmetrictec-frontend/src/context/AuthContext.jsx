// context/AuthContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Aquí guardaremos { username,email, is_admin }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Al cargar la app, revisamos si hay un token y pedimos los datos del usuario
        const token = localStorage.getItem("token");
        if (token) {
            api.get(`${import.meta.env.VITE_API_URL}/user/me`)
            .then(res => res.data)
            .then(data => {
                if (data) setUser(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);