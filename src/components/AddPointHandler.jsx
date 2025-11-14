// src/components/AddPointHandler.jsx

import React, { useState } from 'react';
import { useMapEvents, Marker, Popup } from 'react-leaflet';
import api from '../services/api';

function AddPointHandler({ types, onPointAdded }) {
    const [tempPoint, setTempPoint] = useState(null); // Ponto temporário
    const [name, setName] = useState('');
    const [typeId, setTypeId] = useState('');

    // Hook mágico do react-leaflet
    const map = useMapEvents({
        click(e) {
            // Ao clicar no mapa, define um ponto temporário
            setTempPoint(e.latlng);
            setName('');
            setTypeId(types.length > 0 ? types[0].id : ''); // Define o primeiro tipo como padrão
        },
    });

    // Função para criar o ponto no backend
    const handleCreatePoint = async (e) => {
        e.preventDefault();
        if (!tempPoint || !name || !typeId) {
            alert('Preencha todos os campos.');
            return;
        }

        try {
            const pointData = {
                name: name,
                latitude: tempPoint.lat,
                longitude: tempPoint.lng,
                type_id: parseInt(typeId, 10),
            };

            await api.post('/map/points', pointData);

            alert('Ponto criado com sucesso!');
            setTempPoint(null); // Limpa o marcador temporário
            onPointAdded();     // Atualiza a lista de pontos no mapa principal

        } catch (error) {
            console.error('Erro ao criar ponto:', error);
            alert('Erro ao criar ponto.');
        }
    };

    // Se não houver um ponto temporário, não renderiza nada
    if (!tempPoint) {
        return null;
    }

    // Renderiza um marcador temporário com um formulário no Popup
    return (
        <Marker position={tempPoint}>
            <Popup minWidth={250}>
                <b>Criar novo Ponto de Parada</b>
                <form onSubmit={handleCreatePoint} style={{ marginTop: '10px' }}>
                    <div>
                        <label>Nome:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Tipo:</label>
                        <select
                            value={typeId}
                            onChange={(e) => setTypeId(e.target.value)}
                            required
                        >
                            {types.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => setTempPoint(null)} style={{ marginLeft: '5px' }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Popup>
        </Marker>
    );
}

export default AddPointHandler;