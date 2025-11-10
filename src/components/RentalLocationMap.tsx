import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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
  const formattedUpdate = lastUpdate 
    ? formatDistanceToNow(new Date(lastUpdate), { locale: ptBR, addSuffix: true })
    : 'Sem atualização recente';

  return (
    <div className="w-full">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
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
