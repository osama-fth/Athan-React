import axios from 'axios';
import { formatDateForAPI } from '../utils/dateUtils';

// Cache per i dati di timezone con TTL di 24 ore
const timezoneCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ore

// Funzione per pulire cache scaduta
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of timezoneCache.entries()) {
    if (now > value.expiresAt) {
      timezoneCache.delete(key);
    }
  }
};

// Ottimizzazione: funzione per ottenere il fuso orario con cache migliorata
const getTimezone = async (lat, lon) => {
  try {
    if (!lat || !lon) {
      throw new Error('Coordinate non valide');
    }
    
    // Arrotonda coordinate per migliorare cache hit rate
    const roundedLat = Math.round(parseFloat(lat) * 10) / 10;
    const roundedLon = Math.round(parseFloat(lon) * 10) / 10;
    const cacheKey = `${roundedLat},${roundedLon}`;
    
    // Pulizia cache scaduta ogni tanto
    if (Math.random() < 0.1) cleanExpiredCache();
    
    // Controlla cache valida
    const cached = timezoneCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    
    // Richiesta API GeoNames
    const response = await axios.get(
      `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=osama_fth`,
      { timeout: 10000 } // 10 secondi timeout
    );
    
    if (response.data?.rawOffset !== undefined) {
      const timezoneData = {
        offset: Math.round(response.data.rawOffset * 3600),
        zoneName: response.data.timezoneId || 'Unknown',
        dst: response.data.dstOffset > 0 ? 1 : 0,
        time: response.data.time || null
      };
      
      // Salva in cache con TTL
      timezoneCache.set(cacheKey, {
        data: timezoneData,
        expiresAt: Date.now() + CACHE_TTL
      });
      
      return timezoneData;
    } else {
      throw new Error('Risposta API non valida');
    }
  } catch (error) {
    console.warn('Errore timezone API, usando fallback:', error.message);
    // Fallback semplificato
    return {
      offset: Math.round(lon / 15) * 3600,
      zoneName: 'Approximated',
      dst: 0,
      time: null
    };
  }
};

// Ottimizzazione: funzione per l'ora locale con memoization
const getLocalTimeForCity = (timezoneData) => {
  if (!timezoneData) return new Date();
  
  try {
    const now = new Date();
    
    // Se l'API fornisce timestamp, usalo come riferimento
    if (timezoneData.time) {
      const apiTime = new Date(timezoneData.time);
      if (!isNaN(apiTime.getTime())) {
        return new Date(apiTime.getTime());
      }
    }
    
    // Fallback con offset
    const localOffset = now.getTimezoneOffset() * 60 * 1000;
    const utcTime = now.getTime() + localOffset;
    return new Date(utcTime + (timezoneData.offset * 1000));
  } catch (error) {
    return new Date();
  }
};

// Ottimizzazione: cache per prayer times
const prayerTimesCache = new Map();

// Funzione per ottenere orari preghiera con cache
const getPrayerTimes = async (city, date) => {
  try {
    const validDate = date instanceof Date && !isNaN(date) ? date : new Date();
    const formattedDate = formatDateForAPI(validDate);
    const cacheKey = `${city.lat}-${city.lon}-${formattedDate}`;
    
    // Controlla cache (valida per l'intera giornata)
    const cached = prayerTimesCache.get(cacheKey);
    if (cached) return cached;
    
    const response = await axios.get(
      `https://api.aladhan.com/v1/timings/${formattedDate}`,
      {
        params: {
          latitude: Number(city.lat),
          longitude: Number(city.lon),
          method: 99,
          methodSettings: '12.5,null,null',
          tune: '0,0,0,0,0,0,0,90'
        },
        timeout: 15000 // 15 secondi timeout
      }
    );
    
    const timings = response.data.data.timings;
    const result = {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha
    };
    
    // Salva in cache
    prayerTimesCache.set(cacheKey, result);
    
    // Limita dimensione cache (mantieni solo ultimi 50 entries)
    if (prayerTimesCache.size > 50) {
      const firstKey = prayerTimesCache.keys().next().value;
      prayerTimesCache.delete(firstKey);
    }
    
    return result;
  } catch (error) {
    console.error('Errore getPrayerTimes:', error.message);
    throw error;
  }
};

// Funzione di ricerca città ottimizzata
const searchCity = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query.trim(),
        format: 'json',
        limit: 5,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'AthanApp/1.0'
      },
      timeout: 10000
    });
    
    return response.data
      .filter(item => item.lat && item.lon) // Filtra solo risultati con coordinate
      .map(item => ({
        id: item.place_id,
        name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }));
  } catch (error) {
    console.error('Errore searchCity:', error.message);
    throw error;
  }
};

// Funzione ottimizzata per cancellare cache
const clearAllCache = async () => {
  try {
    // Cancella cache in memoria
    timezoneCache.clear();
    prayerTimesCache.clear();
    
    return true;
  } catch (error) {
    console.error('Errore clearAllCache:', error);
    throw error;
  }
};

export default {
  getPrayerTimes,
  searchCity,
  getTimezone,
  getLocalTimeForCity,
  clearAllCache
};
