// src/services/prayerService.js
import axios from 'axios';
import { formatDateForAPI } from '../utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache per i dati di timezone
const timezoneCache = {};

// Funzione per ottenere il fuso orario con cache (come nella versione web)
const getTimezone = async (lat, lon) => {
  try {
    if (!lat || !lon) {
      return Promise.reject(new Error('Coordinate non valide'));
    }
    
    // Arrotonda le coordinate a 1 decimale per migliorare la cache
    const roundedLat = Math.round(parseFloat(lat) * 10) / 10;
    const roundedLon = Math.round(parseFloat(lon) * 10) / 10;
    const cacheKey = `${roundedLat},${roundedLon}`;
    
    // Verifica se abbiamo già questa posizione in cache con scadenza
    if (timezoneCache[cacheKey] && Date.now() < timezoneCache[cacheKey].expiresAt) {
      return timezoneCache[cacheKey].data;
    }
    
    // Usa l'API GeoNames
    const url = `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=osama_fth`;
    
    const response = await axios.get(url);
    
    if (response.data && typeof response.data.rawOffset !== 'undefined') {
      // Converti in un formato coerente
      const timezoneData = {
        offset: Math.round(response.data.rawOffset * 3600), // Converti in secondi
        zoneName: response.data.timezoneId || 'Unknown',
        dst: response.data.dstOffset > 0 ? 1 : 0,
        time: response.data.time || null
      };
      
      // Esempio di cache con scadenza
      timezoneCache[cacheKey] = {
        data: timezoneData,
        timestamp: Date.now(), // Quando è stato salvato
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Scade dopo 24 ore
      };
      
      return timezoneData;
    } else {
      throw new Error('Risposta API non valida');
    }
  } catch (error) {
    // Fallback basato sulla longitudine - manteniamo per compatibilità
    // ma preferibilmente useremmo semplicemente la risposta dell'API
    const fallbackOffset = Math.round(lon / 15) * 60 * 60;
    const fallbackData = {
      offset: fallbackOffset,
      zoneName: 'Approximated',
      dst: 0,
      time: null
    };
    
    return fallbackData;
  }
};

// Funzione per calcolare l'ora locale, ottimizzata per utilizzare time dall'API quando disponibile
const getLocalTimeForCity = (timezoneData) => {
  try {
    const now = new Date();
    
    // Se l'API ha fornito un timestamp, lo usiamo come riferimento
    if (timezoneData.time) {
      const apiTimeString = timezoneData.time;
      const apiTime = new Date(apiTimeString);
      
      if (!isNaN(apiTime.getTime())) {
        // Calcola la differenza tra l'ora dell'API e l'ora attuale
        const elapsedSinceApiResponse = now.getTime() - (new Date().getTime());
        
        // Aggiunge questa differenza all'ora fornita dall'API
        return new Date(apiTime.getTime() + elapsedSinceApiResponse);
      }
    }
    
    // Fallback al metodo dell'offset se time non è disponibile o valido
    const localOffset = now.getTimezoneOffset() * 60 * 1000; // Millisecondi
    const utcTime = now.getTime() + localOffset;
    const cityTime = new Date(utcTime + (timezoneData.offset * 1000));
    
    return cityTime;
  } catch (error) {
    return new Date(); // Fallback all'ora del dispositivo in caso di errore
  }
};

// Funzione per ottenere orari preghiera
const getPrayerTimes = async (city, date) => {
  try {
    const validDate = date instanceof Date && !isNaN(date) ? date : new Date();
    const formattedDate = formatDateForAPI(validDate);
    
    const apiUrl = `https://api.aladhan.com/v1/timings/${formattedDate}`;
    
    const response = await axios.get(apiUrl, {
      params: {
        latitude: Number(city.lat),
        longitude: Number(city.lon),
        method: 99,
        methodSettings: '12.5,null,null',
        tune: '0,0,0,0,0,0,0,90'
      }
    });
    
    const timings = response.data.data.timings;
    return {
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha
    };
  } catch (error) {
    throw error;
  }
};

// Funzione di ricerca città
const searchCity = async (query) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 5
      },
      headers: {
        'User-Agent': 'AthanApp/1.0'
      }
    });
    
    return response.data.map(item => ({
      id: item.place_id,
      name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon)
    }));
  } catch (error) {
    throw error;
  }
};

// Aggiungi questa funzione al prayerService
const clearAllCache = async () => {
  try {
    // 1. Svuota la cache del fuso orario in memoria
    for (const key in timezoneCache) {
      if (timezoneCache.hasOwnProperty(key)) {
        delete timezoneCache[key];
      }
    }
    
    // Alternativa per svuotare la cache in modo più diretto
    Object.keys(timezoneCache).forEach(key => {
      delete timezoneCache[key];
    });
    
    // 2. Rimuovi tutti i dati pertinenti da AsyncStorage
    await AsyncStorage.multiRemove([
      'selectedCity',  // Città selezionata
      'recentCities',  // Città recenti
      'lastSearchQuery' // Eventuali query di ricerca salvate
    ]);
    
    return true; // Tutto cancellato con successo
  } catch (error) {
    console.error('Errore durante la cancellazione delle cache:', error);
    throw error;
  }
};

// Nel tuo export esistente, aggiungi questa funzione
export default {
  getPrayerTimes,
  searchCity,
  getTimezone,
  getLocalTimeForCity,
  clearAllCache  // Aggiungi questa funzione all'export
};
