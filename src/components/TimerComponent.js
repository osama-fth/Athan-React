import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';
import { 
  calculateTimeOffset, 
  calculateNextPrayer, 
  formatCountdown, 
  getCityTimeWithOffset 
} from '../utils/timeUtils';

// Componente timer ottimizzato con utilità condivise
const TimerComponent = ({ prayerTimes, timezone, prayerService, nextPrayerCallback, style }) => {
  const [countdown, setCountdown] = useState('--:--:--');
  const intervalRef = useRef(null);
  const offsetRef = useRef(null);
  const nextPrayerRef = useRef({ prayer: null, time: null });

  useEffect(() => {
    if (!timezone || !prayerTimes || !prayerService) {
      setCountdown('--:--:--');
      return;
    }

    // Usa la funzione condivisa per calcolare l'offset
    offsetRef.current = calculateTimeOffset(timezone, prayerService);
    
    // Funzione di aggiornamento ottimizzata
    const updateTimer = () => {
      try {
        const cityTime = getCityTimeWithOffset(offsetRef.current);
        
        // Calcola prossima preghiera se necessario
        if (!nextPrayerRef.current.prayer || !nextPrayerRef.current.time) {
          const result = calculateNextPrayer(prayerTimes, cityTime);
          nextPrayerRef.current = result;
          
          if (nextPrayerCallback && result.prayer) {
            nextPrayerCallback(result.prayer);
          }
        }
        
        const timeDiff = nextPrayerRef.current.time - cityTime;
        
        // Se tempo scaduto, ricalcola
        if (timeDiff <= 0) {
          const result = calculateNextPrayer(prayerTimes, cityTime);
          nextPrayerRef.current = result;
          
          if (nextPrayerCallback && result.prayer) {
            nextPrayerCallback(result.prayer);
          }
          return updateTimer();
        }
        
        // Usa la funzione condivisa per formattare
        setCountdown(formatCountdown(timeDiff));
      } catch (error) {
        console.error('Errore aggiornamento timer:', error);
        setCountdown('--:--:--');
      }
    };
    
    updateTimer();
    
    // Pulisci intervallo precedente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(updateTimer, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [prayerTimes, timezone, prayerService, nextPrayerCallback]);
  
  return <Text style={style}>{countdown}</Text>;
};

export default TimerComponent;
