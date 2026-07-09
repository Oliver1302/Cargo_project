// Converts a text address into { lat, lng }. Returns null if no Google Maps API key is
// configured yet, or if the lookup fails — callers must handle a null result gracefully.
export async function geocodeAddress(address) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    const location = data.results?.[0]?.geometry?.location;
    return location ? { lat: location.lat, lng: location.lng } : null;
  } catch (err) {
    console.error("Geocode error:", err.message);
    return null;
  }
}

// Straight-line distance in miles between two coordinates (Haversine formula).
// Used as a quick estimate — not turn-by-turn driving distance.
export function haversineMiles(a, b) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
