import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // TODOS os hooks devem ser chamados primeiro, incondicionalmente
  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const formattedUpdate = lastUpdate 
    ? formatDistanceToNow(new Date(lastUpdate), { locale: ptBR, addSuffix: true })
    : 'Sem atualização recente';

  useEffect(() => {
    if (!isMapReady || !containerRef.current) return;
    if (mapRef.current) return;
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;

    const map = L.map(containerRef.current).setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.bindPopup(`${clientName} - Atualizado ${formattedUpdate}`);

    mapRef.current = map;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 300);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isMapReady, latitude, longitude, clientName, formattedUpdate]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) return;
    
    markerRef.current.setLatLng([latitude, longitude]);
    markerRef.current.setPopupContent(`${clientName} - Atualizado ${formattedUpdate}`);
    mapRef.current.panTo([latitude, longitude]);
  }, [latitude, longitude, clientName, formattedUpdate]);

  // Validação de coordenadas - DEPOIS dos hooks
  const invalidCoords = !latitude || !longitude || isNaN(latitude) || isNaN(longitude);
  
  if (invalidCoords) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <p className="text-muted-foreground">Coordenadas inválidas ou não disponíveis</p>
      </div>
    );
  }

  if (!isMapReady) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        className="z-0"
      />
      <div className="mt-2 text-xs text-muted-foreground text-center">
        Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </div>
    </div>
  );
};
