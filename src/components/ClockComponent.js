import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';
import { calculateTimeOffset, getCityTimeWithOffset } from '../utils/timeUtils';

// Componente ottimizzato per l'orologio con utilità condivise
const ClockComponent = ({ timezone, prayerService, style }) => {
  const [time, setTime] = useState('--:--:--');
  const offsetRef = useRef(null);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (!timezone || !prayerService) {
      setTime('--:--:--');
      return;
    }
    
    // Usa la funzione condivisa per calcolare l'offset
    offsetRef.current = calculateTimeOffset(timezone, prayerService);
    
    // Funzione di aggiornamento ottimizzata
    const updateClock = () => {
      const cityTime = getCityTimeWithOffset(offsetRef.current);
      
      setTime(cityTime.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    updateClock();
    
    // Pulisci intervallo precedente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(updateClock, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timezone, prayerService]);
  
  return <Text style={style}>{time}</Text>;
};

export default ClockComponent;

