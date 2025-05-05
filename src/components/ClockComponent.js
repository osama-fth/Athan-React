import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

const ClockComponent = ({ timezone, prayerService, style }) => {
  const [time, setTime] = useState('--:--:--');
  
  useEffect(() => {
    if (!timezone || !prayerService) return;
    
    // Calcola l'offset tra l'ora locale e l'ora della città
    const calculateOffset = () => {
      // Ottieni l'ora della città dal servizio
      const cityTime = prayerService.getLocalTimeForCity(timezone);
      // Ottieni l'ora locale del dispositivo
      const localTime = new Date();
      
      // Resetta i secondi e i millisecondi dell'ora della città per mantenere solo ore e minuti
      const cityTimeWithoutSeconds = new Date(cityTime);
      cityTimeWithoutSeconds.setSeconds(0, 0);
      
      // Resetta i secondi e i millisecondi dell'ora locale per confrontare solo ore e minuti
      const localTimeWithoutSeconds = new Date(localTime);
      localTimeWithoutSeconds.setSeconds(0, 0);
      
      // Calcola l'offset basato solo su ore e minuti
      return cityTimeWithoutSeconds.getTime() - localTimeWithoutSeconds.getTime();
    };
    
    // Calcoliamo l'offset una volta sola
    const offset = calculateOffset();
    
    // Funzione di aggiornamento che usa l'ora locale + offset e mantiene i secondi del dispositivo
    const updateClock = () => {
      // Ottieni l'ora attuale del dispositivo con secondi aggiornati
      const now = new Date();
      
      // Applica l'offset all'ora del dispositivo per ottenere l'ora della città
      // ma conservando i secondi dell'orologio del dispositivo
      const cityTime = new Date(now.getTime() + offset);
      
      setTime(cityTime.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    // Esecuzione iniziale
    updateClock();
    
    // Aggiorna ogni secondo
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, [timezone, prayerService]);
  
  return <Text style={style}>{time}</Text>;
};

export default ClockComponent;

