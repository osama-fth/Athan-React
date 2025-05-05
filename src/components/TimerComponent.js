import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';

const TimerComponent = ({ prayerTimes, timezone, prayerService, nextPrayerCallback, style }) => {
  // Stati e ref necessari
  const [countdown, setCountdown] = useState('--:--:--');
  const intervalRef = useRef(null);
  const offsetRef = useRef(null);
  const nextPrayerRef = useRef({ prayer: null, time: null });

  // Effetto per calcolare l'offset iniziale e impostare l'intervallo
  useEffect(() => {
    if (!timezone || !prayerTimes || !prayerService) return;

    // Calcola l'offset tra l'ora locale e l'ora della città (come in ClockComponent)
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
    
    // Memorizza l'offset per uso futuro
    offsetRef.current = calculateOffset();
    
    // Funzione di aggiornamento che usa l'ora locale + offset
    const updateTimer = () => {
      try {
        // Ottieni l'ora della città usando l'offset pre-calcolato e i secondi del dispositivo
        const now = new Date();
        const cityTime = new Date(now.getTime() + offsetRef.current);
        
        // Determina la prossima preghiera se necessario
        if (!nextPrayerRef.current.prayer || !nextPrayerRef.current.time) {
          const result = calculateNextPrayer(cityTime);
          nextPrayerRef.current = result;
          
          if (nextPrayerCallback && result.prayer) {
            nextPrayerCallback(result.prayer);
          }
        }
        
        // Calcola la differenza di tempo
        const timeDiff = nextPrayerRef.current.time - cityTime;
        
        // Se il tempo è scaduto, ricalcola la prossima preghiera
        if (timeDiff <= 0) {
          const result = calculateNextPrayer(cityTime);
          nextPrayerRef.current = result;
          
          if (nextPrayerCallback && result.prayer) {
            nextPrayerCallback(result.prayer);
          }
          
          // Ritorna per ricalcolare il countdown con i nuovi valori
          return updateTimer();
        }
        
        // Formatta il countdown con precisione al secondo
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        const formattedCountdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setCountdown(formattedCountdown);
      } catch (error) {
        console.error('Errore nell\'aggiornamento del timer:', error);
        setCountdown('--:--:--');
      }
    };
    
    // Funzione per determinare la prossima preghiera
    const calculateNextPrayer = (cityTime) => {
      try {
        const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        let nextPrayerFound = null;
        let nextPrayerTimeObj = null;
        
        for (const prayer of prayers) {
          if (!prayerTimes[prayer]) continue;
          
          const [prayerHours, prayerMinutes] = prayerTimes[prayer].split(':').map(Number);
          const prayerTime = new Date(cityTime);
          prayerTime.setHours(prayerHours, prayerMinutes, 0, 0);
          
          if (cityTime < prayerTime) {
            nextPrayerFound = prayer;
            nextPrayerTimeObj = prayerTime;
            break;
          }
        }
        
        // Se non c'è una preghiera successiva oggi, prendi la prima di domani
        if (!nextPrayerFound) {
          nextPrayerFound = prayers[0];
          const [prayerHours, prayerMinutes] = prayerTimes[prayers[0]].split(':').map(Number);
          nextPrayerTimeObj = new Date(cityTime);
          nextPrayerTimeObj.setDate(nextPrayerTimeObj.getDate() + 1);
          nextPrayerTimeObj.setHours(prayerHours, prayerMinutes, 0, 0);
        }
        
        return { prayer: nextPrayerFound, time: nextPrayerTimeObj };
      } catch (error) {
        console.error('Errore nel calcolo della prossima preghiera:', error);
        return { prayer: null, time: null };
      }
    };
    
    // Prima esecuzione immediata
    updateTimer();
    
    // Pulisci eventuali intervalli precedenti
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Imposta il nuovo intervallo per aggiornamento ogni secondo
    intervalRef.current = setInterval(updateTimer, 1000);
    
    // Pulizia al dismount
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
