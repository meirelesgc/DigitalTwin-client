// src/components/MapComponent.jsx

import React, { useState, useEffect } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddPointHandler from './AddPointHandler';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- Correção do Ícone (igual ao seu) ---
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Limites do Mapa (igual ao seu) ---
const bounds = [
    [-25.437, -54.598],
    [-25.433, -54.592]
];

function MapComponent() {
    const { logout } = useAuth();
    const [points, setPoints] = useState([]);
    const [paths, setPaths] = useState([]);
    const [types, setTypes] = useState([]);

    // --- NOVO ESTADO PARA CRIAR CAMINHOS ---
    const [pathStartPoint, setPathStartPoint] = useState(null); // Armazena o ponto de início

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

    useEffect(() => {
        fetchData();
    }, []);

    const formatGeoJsonCoords = (coordinates) => {
        return coordinates.map(coord => [coord[1], coord[0]]);
    };

    // --- NOVA FUNÇÃO: REMOVER PONTO ---
    const handleDeletePoint = async (pointId) => {
        if (window.confirm('Tem certeza que deseja remover este ponto? Todos os caminhos ligados a ele serão removidos.')) {
            try {
                await api.delete(`/map/points/${pointId}`);
                alert('Ponto removido com sucesso!');
                fetchData(); // Atualiza o mapa
            } catch (error) {
                console.error('Erro ao remover ponto:', error);
                alert('Erro ao remover ponto.');
            }
        }
    };

    // --- NOVAS FUNÇÕES: CRIAR CAMINHO ---

    // 1. Define o ponto de início
    const handleSetPathStart = (point) => {
        setPathStartPoint(point);
        alert(`Ponto "${point.name}" definido como INÍCIO. Agora, clique em outro ponto para definir o FIM.`);
        // Fecha todos os popups (opcional, mas limpa a interface)
        const map = document.querySelector(".leaflet-container");
        if (map) {
            map.leaflet_map.closePopup();
        }
    };

    // 2. Define o ponto final e envia para a API
    const handleSetPathEnd = async (endPoint) => {
        if (!pathStartPoint) return; // Segurança

        // Pedimos os dados restantes ao usuário
        const name = prompt("Qual o nome deste caminho? (Ex: Rota Principal)");
        if (!name) return setPathStartPoint(null); // Cancelado

        const direction = prompt("Qual a direção? (ida, volta, ambos)");
        if (!['ida', 'volta', 'ambos'].includes(direction)) {
            alert('Direção inválida. A criação do caminho foi cancelada.');
            return setPathStartPoint(null);
        }

        // Criamos o 'route_nodes' como uma linha reta simples (GeoJSON)
        // Lembre-se: GeoJSON é [Longitude, Latitude]
        const routeNodes = {
            type: "LineString",
            coordinates: [
                [pathStartPoint.longitude, pathStartPoint.latitude],
                [endPoint.longitude, endPoint.latitude]
            ]
        };

        const pathData = {
            name: name,
            start_point_id: pathStartPoint.id,
            end_point_id: endPoint.id,
            direction: direction,
            route_nodes: routeNodes
        };

        try {
            await api.post('/map/paths', pathData);
            alert('Caminho criado com sucesso!');
            fetchData(); // Atualiza o mapa
        } catch (error) {
            console.error('Erro ao criar caminho:', error);
            alert('Erro ao criar caminho.');
        } finally {
            setPathStartPoint(null); // Limpa o estado
        }
    };


    return (
        <div>
            <button onClick={logout} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
                Sair
            </button>

            {/* Botão para cancelar a criação do caminho */}
            {pathStartPoint && (
                <button
                    onClick={() => setPathStartPoint(null)}
                    style={{ position: 'absolute', top: 50, right: 10, zIndex: 1000, background: 'orange' }}
                >
                    Cancelar Criação de Caminho
                </button>
            )}

            <MapContainer
                center={[-25.435, -54.595]}
                zoom={18}
                style={{ height: '100vh', width: '100%' }}
                maxBounds={bounds}
                minZoom={17}
                maxBoundsViscosity={1.0}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />

                {/* --- MARKERS E POPUPS ATUALIZADOS --- */}
                {points.map((point) => (
                    <Marker
                        key={point.id}
                        position={[point.latitude, point.longitude]}
                    >
                        <Popup>
                            <b>{point.name}</b> <br />
                            Tipo: {point.type.name}

                            <hr style={{ margin: '8px 0' }} />

                            {/* Lógica condicional para criar caminhos */}
                            {!pathStartPoint ? (
                                <button onClick={() => handleSetPathStart(point)}>
                                    Definir como Início do Caminho
                                </button>
                            ) : (
                                pathStartPoint.id !== point.id && (
                                    <button onClick={() => handleSetPathEnd(point)} style={{ background: 'green', color: 'white' }}>
                                        Definir como Fim do Caminho
                                    </button>
                                )
                            )}

                            <button onClick={() => handleDeletePoint(point.id)} style={{ background: 'red', color: 'white', marginLeft: '5px' }}>
                                Remover Ponto
                            </button>
                        </Popup>
                    </Marker>
                ))}

                {/* Renderização dos caminhos (sem alteração) */}
                {paths.map((path) => (
                    <Polyline
                        key={path.id}
                        positions={formatGeoJsonCoords(path.route_nodes.coordinates)}
                        color={path.direction === 'ida' ? 'blue' : (path.direction === 'volta' ? 'red' : 'green')}
                    >
                        <Popup>
                            <b>{path.name}</b> <br />
                            De: {path.start_point.name} <br />
                            Para: {path.end_point.name} <br />
                            Direção: {path.direction}
                        </Popup>
                    </Polyline>
                ))}

                {!pathStartPoint && (
                    <AddPointHandler types={types} onPointAdded={fetchData} />
                )}
            </MapContainer>
        </div>
    );
}

export default MapComponent;