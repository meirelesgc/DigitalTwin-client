import { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));

    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            console.log('Resposta recebida da API:', response.data);

            const { access_token } = response.data;

            if (!access_token) {
                console.error("A resposta da API não contém 'access_token'.", response.data);
                throw new Error("Token não encontrado na resposta"); // Isto força o catch
            }

            setToken(access_token);
            localStorage.setItem('authToken', access_token);
            return true;
        } catch (error) {
            console.error('Falha no processamento do login:', error);
            return false;
        }
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};