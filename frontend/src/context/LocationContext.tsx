import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { getCurrentPosition, reverseGeocode, formatHeaderLocation } from '../services/locationService';
import type { LocationDetails } from '../services/locationService';

interface LocationContextType {
  locationDetails: LocationDetails | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  refreshLocation: () => Promise<LocationDetails | null>;
  setManualLocation: (locality: string, city: string) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const refreshLocation = async (): Promise<LocationDetails | null> => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPermissionStatus('granted');
      const details = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLocationDetails(details);

      // Persist to backend if patient profile exists
      if (user?.role === 'PATIENT') {
        try {
          await api.put('/patients/profile', {
            lat: details.latitude,
            lng: details.longitude,
            locality: details.locality,
            subLocality: details.subLocality,
            city: details.city,
            district: details.district || details.city,
            state: details.state,
            postalCode: details.postalCode,
            country: details.country,
            formattedAddress: details.formattedAddress,
          });
        } catch {
          // ignore API error
        }
      }

      setLoading(false);
      return details;
    } catch (err: any) {
      if (err?.type === 'PERMISSION_DENIED') {
        setPermissionStatus('denied');
      }
      
      // Fallback to stored patient or doctor profile location if available
      const p = user?.patient;
      const d = user?.doctor;
      if (p?.locality || p?.district || p?.city) {
        const storedDetails: LocationDetails = {
          latitude: p.lat || 0,
          longitude: p.lng || 0,
          locality: p.locality || null,
          subLocality: p.subLocality || null,
          city: p.city || null,
          district: p.district || null,
          state: p.state || null,
          postalCode: p.postalCode || null,
          country: p.country || null,
          formattedAddress: p.formattedAddress || p.address || null,
          displayHeader: formatHeaderLocation(p, p.district),
          isLive: false,
        };
        setLocationDetails(storedDetails);
      } else if (d?.hospital) {
        const docHospitalName = d.hospital.name || '';
        const docDistrict = d.hospital.district || 'Clinical Campus';
        const storedDetails: LocationDetails = {
          latitude: 0,
          longitude: 0,
          locality: docHospitalName || null,
          subLocality: null,
          city: docDistrict || null,
          district: docDistrict || null,
          state: null,
          postalCode: null,
          country: null,
          formattedAddress: [docHospitalName, docDistrict].filter(Boolean).join(', ') || null,
          displayHeader: docHospitalName || docDistrict || 'Clinical Campus',
          isLive: false,
        };
        setLocationDetails(storedDetails);
      } else {
        setError(err.message || 'Location permission denied or GPS unavailable.');
      }
      setLoading(false);
      return null;
    }
  };

  const setManualLocation = async (locality: string, city: string) => {
    const manualDetails: LocationDetails = {
      latitude: 0,
      longitude: 0,
      locality: locality || null,
      subLocality: null,
      city: city || null,
      district: city || null,
      state: null,
      postalCode: null,
      country: null,
      formattedAddress: locality ? `${locality}, ${city}` : city,
      displayHeader: locality ? `${locality}, ${city}` : city,
      isLive: false,
    };
    setLocationDetails(manualDetails);

    if (user?.role === 'PATIENT') {
      try {
        await api.put('/patients/profile', {
          locality: locality || null,
          city: city || null,
          district: city || null,
          formattedAddress: locality ? `${locality}, ${city}` : city,
        });
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    refreshLocation();
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        locationDetails,
        loading,
        error,
        permissionStatus,
        refreshLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
