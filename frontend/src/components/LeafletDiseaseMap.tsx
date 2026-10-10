import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Filter, Layers, Info } from 'lucide-react';
import api from '../services/api';

interface MapCase {
  id: string;
  disease: string;
  district: string;
  lat: number;
  lng: number;
  severity: string;
  ageGroup: string;
}

interface HotspotCluster {
  cluster_id: string;
  disease: string;
  district: string;
  center_lat: number;
  center_lng: number;
  case_count: number;
  radius_km: number;
  severity: string;
  risk_color: string;
}

export const LeafletDiseaseMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [diseaseFilter, setDiseaseFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [mapData, setMapData] = useState<{ cases: MapCase[]; hotspots: HotspotCluster[]; totalCases: number }>({
    cases: [],
    hotspots: [],
    totalCases: 0,
  });
  const [loading, setLoading] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([19.8917, 74.4789], 12);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Smart Health Surveillance (Kopargaon-Shirdi Zone)',
        maxZoom: 18,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map alive during tab transitions
    };
  }, []);

  // Fetch and update map points
  const fetchMapData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/surveillance/map-data', {
        params: {
          disease: diseaseFilter,
          district: districtFilter,
        },
      });
      setMapData(res.data);
      renderMapLayers(res.data.cases, res.data.hotspots);
    } catch (err) {
      console.error('Failed to load surveillance map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [diseaseFilter, districtFilter]);

  const renderMapLayers = (cases: MapCase[], hotspots: HotspotCluster[]) => {
    if (!layersGroupRef.current || !mapInstanceRef.current) return;
    layersGroupRef.current.clearLayers();

    // 1. Render Hotspot Clusters (DBSCAN)
    hotspots.forEach((h) => {
      const color = h.severity === 'HIGH_RISK' ? '#ef4444' : (h.severity === 'WARNING' ? '#f59e0b' : '#10b981');
      const fillColor = color;

      // Outer radius circle
      const circle = L.circle([h.center_lat, h.center_lng], {
        color,
        fillColor,
        fillOpacity: 0.25,
        radius: h.radius_km * 800, // converted to meters
        weight: 2,
      });

      // Centroid marker with pulsing effect
      const marker = L.circleMarker([h.center_lat, h.center_lng], {
        radius: Math.min(22, Math.max(10, h.case_count * 0.4)),
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.9,
        weight: 3,
      });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: 800; color: ${color}; font-size: 14px; margin-bottom: 4px;">
            🚨 ${h.cluster_id} (${h.severity})
          </div>
          <div style="font-size: 12px; color: #1e293b; margin-bottom: 2px;">
            <strong>Disease:</strong> ${h.disease}
          </div>
          <div style="font-size: 12px; color: #1e293b; margin-bottom: 2px;">
            <strong>District:</strong> ${h.district}
          </div>
          <div style="font-size: 12px; color: #1e293b; margin-bottom: 4px;">
            <strong>Active Cluster Cases:</strong> ${h.case_count}
          </div>
          <div style="font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
            <em>DBSCAN Geospatial Cluster Radius: ~${h.radius_km} km</em>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      circle.bindPopup(popupContent);

      circle.addTo(layersGroupRef.current!);
      marker.addTo(layersGroupRef.current!);
    });

    // 2. Render Individual Anonymized Case Pins
    cases.forEach((c) => {
      const casePin = L.circleMarker([c.lat, c.lng], {
        radius: 4,
        color: '#334155',
        fillColor: c.disease.toLowerCase().includes('malaria') ? '#ef4444' : '#0284c7',
        fillOpacity: 0.7,
        weight: 1,
      });

      casePin.bindPopup(`
        <div style="font-size: 12px; font-family: sans-serif;">
          <strong>Case:</strong> ${c.disease}<br/>
          <strong>District:</strong> ${c.district}<br/>
          <strong>Severity:</strong> ${c.severity}<br/>
          <strong>Demographic:</strong> Age ${c.ageGroup}<br/>
          <span style="font-size: 10px; color: #94a3b8;">Identity Anonymized</span>
        </div>
      `);

      casePin.addTo(layersGroupRef.current!);
    });

    // Fit map bounds if points exist
    if (hotspots.length > 0) {
      const group = L.featureGroup(layersGroupRef.current.getLayers());
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="card-title">
            <Layers size={20} color="var(--primary-600)" />
            Real-Time Geospatial Disease Surveillance Map
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            DBSCAN spatial clustering reveals localized epidemic hotspots, transmission zones, and density gradients.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value)}
            >
              <option value="ALL">All Tracked Diseases</option>
              <option value="Malaria">Malaria</option>
              <option value="Dengue">Dengue</option>
              <option value="Typhoid">Typhoid</option>
              <option value="COVID-19">COVID-19</option>
              <option value="Cholera">Cholera</option>
            </select>
          </div>

          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="ALL">All Districts / Talukas</option>
            <option value="Kopargaon">Kopargaon (Outbreak Zone)</option>
            <option value="Shirdi">Shirdi (High Alert)</option>
            <option value="Rahata">Rahata</option>
            <option value="Sangamner">Sangamner</option>
            <option value="Yeola">Yeola</option>
          </select>
        </div>
      </div>

      {/* Map Stats Banner */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          fontSize: '0.85rem',
        }}
      >
        <div>
          <strong>Active Hotspots Detected: </strong>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>{mapData.hotspots.length}</span>
        </div>
        <div>
          <strong>Total Geo-Cases Analyzed: </strong>
          <span style={{ fontWeight: 700 }}>{mapData.totalCases}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span> High Risk
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Warning
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Normal
          </span>
        </div>
      </div>

      {/* Leaflet Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{
          height: '520px',
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid var(--border-light)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
          zIndex: 1,
        }}
      />

      <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Info size={14} /> Anonymization Notice: Individual patient identifiers are strictly scrubbed; points represent anonymized clinical presentations.
      </div>
    </div>
  );
};
