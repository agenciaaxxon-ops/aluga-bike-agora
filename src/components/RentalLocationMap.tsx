import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Fix para ícones do Leaflet não aparecerem
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente interno para invalidar o tamanho do mapa
const MapInvalidator = () => {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);
  
  return null;
};

interface RentalLocationMapProps {
  latitude: number;
  longitude: number;
  clientName: string;
  lastUpdate?: string;
}

export const RentalLocationMap = ({ 
  latitude, 
  longitude, 
  clientName, 
  lastUpdate 
}: RentalLocationMapProps) => {
  // Validação de coordenadas
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Coordenadas inválidas ou não disponíveis</p>
      </div>
    );
  }

  const formattedUpdate = lastUpdate 
    ? formatDistanceToNow(new Date(lastUpdate), { locale: ptBR, addSuffix: true })
    : 'Sem atualização recente';

  return (
    <div className="w-full">
      <MapContainer
        key={`${latitude}-${longitude}`}
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <MapInvalidator />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            <div className="text-sm">
              <strong className="block mb-1">{clientName}</strong>
              <span className="text-muted-foreground">
                Atualizado {formattedUpdate}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};
