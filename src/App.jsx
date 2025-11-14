// src/App.jsx

import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import MapComponent from './components/MapComponent';

function App() {
    const { token } = useAuth();

    return (
        <div className="App">
            {token ? <MapComponent /> : <LoginPage />}
        </div>
    );
}

export default App;