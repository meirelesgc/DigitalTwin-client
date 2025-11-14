// src/components/MapComponent.jsx

import React, { useState, useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // ESTILO OBRIGATÓRIO do Leaflet
import L from 'leaflet'; // Importamos o 'L' para corrigir o ícone

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddPointHandler from './AddPointHandler'; // Componente de clique (próximo passo)

// --- Correção do ícone padrão do Leaflet ---
// O Vite pode ter problemas para carregar os ícones. Esta é a correção:
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41], // Ponto do ícone que corresponde à localização
});
L.Marker.prototype.options.icon = DefaultIcon;
// --- Fim da correção ---


function MapComponent() {
    const { logout } = useAuth();
    const [points, setPoints] = useState([]);
    const [paths, setPaths] = useState([]);
    const [types, setTypes] = useState([]);

    // Função para buscar todos os dados do mapa
    const fetchData = async () => {
        try {
            const [pointsRes, pathsRes, typesRes] = await Promise.all([
                api.get('/map/points'),
                api.get('/map/paths'),
                api.get('/map/types'),
            ]);
            setPoints(pointsRes.data.stop_points);
            setPaths(pathsRes.data.paths);
            setTypes(typesRes.data.stop_point_types);
        } catch (error) {
            console.error('Erro ao buscar dados do mapa:', error);
        }
    };

    // useEffect para buscar dados quando o componente é montado
    useEffect(() => {
        fetchData();
    }, []);

    // O backend armazena GeoJSON [longitude, latitude]
    // O Leaflet espera [latitude, longitude].
    // Esta função corrige isso.
    const formatGeoJsonCoords = (coordinates) => {
        return coordinates.map(coord => [coord[1], coord[0]]);
    };

    return (
        <div>
            <button onClick={logout} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                Sair
            </button>

            <MapContainer
                center={[-12.25, -38.95]} // Ponto central inicial (Ex: Feira de Santana, BA)
                zoom={15}
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* 1. Renderiza os Pontos de Parada existentes */}
                {points.map((point) => (
                    <Marker
                        key={point.id}
                        position={[point.latitude, point.longitude]}
                    >
                        <Popup>
                            <b>{point.name}</b> <br />
                            Tipo: {point.type.name}
                        </Popup>
                    </Marker>
                ))}

                {/* 2. Renderiza os Caminhos existentes */}
                {paths.map((path) => (
                    <Polyline
                        key={path.id}
                        positions={formatGeoJsonCoords(path.route_nodes.coordinates)}
                        color={path.direction === 'ida' ? 'blue' : 'green'}
                    >
                        <Popup>
                            <b>{path.name}</b> <br />
                            De: {path.start_point.name} <br />
                            Para: {path.end_point.name} <br />
                            Direção: {path.direction}
                        </Popup>
                    </Polyline>
                ))}

                <AddPointHandler types={types} onPointAdded={fetchData} />

            </MapContainer>
        </div>
    );
}

export default MapComponent;