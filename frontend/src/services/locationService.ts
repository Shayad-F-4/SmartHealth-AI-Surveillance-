/**
 * SmartHealth Live Geolocation & Real Locality Reverse-Geocoding Service
 * Uses OpenStreetMap Nominatim reverse-geocoding API to resolve coordinates to verified structured localities.
 */

export interface LocationDetails {
  latitude: number;
  longitude: number;
  locality: string | null;
  subLocality: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  formattedAddress: string | null;
  displayHeader: string;
  isLive: boolean;
}

export interface GeolocationError {
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
}

/**
 * Reverse geocode latitude/longitude coordinates to structured locality details.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationDetails> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding HTTP ${response.status}`);
    }

    const data = await response.json();
    const addr = data?.address || {};

    // Extract locality components in order of specificity
    const subLocality = addr.neighbourhood || addr.suburb || addr.residential || addr.quarter || addr.hamlet || null;
    const locality = subLocality || addr.suburb || addr.village || addr.town || addr.city_district || addr.road || null;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || null;
    const district = addr.state_district || addr.county || addr.district || city || null;
    const state = addr.state || null;
    const postalCode = addr.postcode || null;
    const country = addr.country || null;
    const formattedAddress = data?.display_name || null;

    // Determine desktop/mobile header display text based on most specific verified locality
    let displayHeader = 'Current Location';
    if (locality && city && locality !== city) {
      displayHeader = `${locality}, ${city}`;
    } else if (locality) {
      displayHeader = locality;
    } else if (city) {
      displayHeader = city;
    } else if (district) {
      displayHeader = district;
    } else {
      displayHeader = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
    }

    return {
      latitude: lat,
      longitude: lng,
      locality,
      subLocality,
      city,
      district,
      state,
      postalCode,
      country,
      formattedAddress,
      displayHeader,
      isLive: true,
    };
  } catch (error) {
    // Fallback using raw coordinates if geocoding service is temporarily unreachable
    return {
      latitude: lat,
      longitude: lng,
      locality: null,
      subLocality: null,
      city: null,
      district: null,
      state: null,
      postalCode: null,
      country: null,
      formattedAddress: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
      displayHeader: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
      isLive: true,
    };
  }
}

/**
 * Request real browser/device coordinates via HTML5 Geolocation API.
 */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      const err: GeolocationError = {
        type: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by your browser.',
      };
      return reject(err);
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        let errType: GeolocationError['type'] = 'UNKNOWN';
        let msg = 'Failed to retrieve location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errType = 'PERMISSION_DENIED';
            msg = 'Location permission was denied by your browser or device.';
            break;
          case error.POSITION_UNAVAILABLE:
            errType = 'POSITION_UNAVAILABLE';
            msg = 'GPS signal or network position unavailable.';
            break;
          case error.TIMEOUT:
            errType = 'TIMEOUT';
            msg = 'Location request timed out. Please try again.';
            break;
        }

        reject({ type: errType, message: msg });
      },
      options
    );
  });
}

/**
 * Helper to construct a human-readable header string from existing profile location fields
 */
export function formatHeaderLocation(loc: Partial<LocationDetails> | null | undefined, fallbackDistrict?: string): string {
  if (!loc) return fallbackDistrict || 'Location unavailable';

  if (loc.locality && loc.city && loc.locality !== loc.city) {
    return `${loc.locality}, ${loc.city}`;
  }
  if (loc.locality) return loc.locality;
  if (loc.city) return loc.city;
  if (loc.district) return loc.district;
  if (loc.formattedAddress) return loc.formattedAddress.split(',')[0];
  if (loc.latitude && loc.longitude) return `${loc.latitude.toFixed(2)}°, ${loc.longitude.toFixed(2)}°`;
  return fallbackDistrict || 'Location unavailable';
}
