import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hook personalizzato per gestire le operazioni sulle città
 * Riduce la duplicazione di codice tra i componenti
 */
export const useCityManager = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [recentCities, setRecentCities] = useState([]);

  // Carica la città selezionata
  const loadSelectedCity = useCallback(async () => {
    try {
      const savedCity = await AsyncStorage.getItem('selectedCity');
      if (savedCity) {
        const cityData = JSON.parse(savedCity);
        setSelectedCity(cityData);
        return cityData;
      }
      return null;
    } catch (error) {
      console.error('Errore nel caricamento della città:', error);
      return null;
    }
  }, []);

  // Carica le città recenti
  const loadRecentCities = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('recentCities');
      if (saved) {
        const cities = JSON.parse(saved);
        setRecentCities(cities);
        return cities;
      }
      return [];
    } catch (error) {
      console.error('Errore nel caricamento delle città recenti:', error);
      return [];
    }
  }, []);

  // Salva una città selezionata e aggiorna le recenti
  const saveSelectedCity = useCallback(async (city) => {
    try {
      // Salva la città selezionata
      await AsyncStorage.setItem('selectedCity', JSON.stringify(city));
      setSelectedCity(city);

      // Aggiorna le città recenti (evita duplicati, massimo 5)
      const updatedRecentCities = [
        city,
        ...recentCities.filter(c => c.id !== city.id)
      ].slice(0, 5);

      setRecentCities(updatedRecentCities);
      await AsyncStorage.setItem('recentCities', JSON.stringify(updatedRecentCities));

      return true;
    } catch (error) {
      console.error('Errore nel salvataggio della città:', error);
      return false;
    }
  }, [recentCities]);

  // Pulisce tutte le città salvate
  const clearAllCities = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['selectedCity', 'recentCities']);
      setSelectedCity(null);
      setRecentCities([]);
      return true;
    } catch (error) {
      console.error('Errore nella pulizia delle città:', error);
      return false;
    }
  }, []);

  return {
    selectedCity,
    recentCities,
    loadSelectedCity,
    loadRecentCities,
    saveSelectedCity,
    clearAllCities,
    setSelectedCity,
    setRecentCities
  };
};
