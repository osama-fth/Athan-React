// Utilità condivise per il calcolo del tempo - evita duplicazione di codice

/**
 * Calcola l'offset tra l'ora della città e l'ora locale del dispositivo
 * @param {Object} timezone - Oggetto timezone dalla API
 * @param {Object} prayerService - Servizio per ottenere l'ora locale
 * @returns {number} Offset in millisecondi
 */
export const calculateTimeOffset = (timezone, prayerService) => {
  if (!timezone || !prayerService) return 0;
  
  try {
    const cityTime = prayerService.getLocalTimeForCity(timezone);
    const localTime = new Date();
    
    // Reset secondi per comparazione accurata
    const cityTimeReset = new Date(cityTime);
    cityTimeReset.setSeconds(0, 0);
    const localTimeReset = new Date(localTime);
    localTimeReset.setSeconds(0, 0);
    
    return cityTimeReset.getTime() - localTimeReset.getTime();
  } catch (error) {
    console.error('Errore nel calcolo dell\'offset:', error);
    return 0;
  }
};

/**
 * Calcola la prossima preghiera basata su orari e ora corrente
 * @param {Object} prayerTimes - Oggetto con gli orari delle preghiere
 * @param {Date} cityTime - Ora attuale della città
 * @returns {Object} Oggetto con prayer e time della prossima preghiera
 */
export const calculateNextPrayer = (prayerTimes, cityTime) => {
  if (!prayerTimes || !cityTime) return { prayer: null, time: null };
  
  try {
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    for (const prayer of prayers) {
      if (!prayerTimes[prayer]) continue;
      
      const [hours, minutes] = prayerTimes[prayer].split(':').map(Number);
      const prayerTime = new Date(cityTime);
      prayerTime.setHours(hours, minutes, 0, 0);
      
      if (cityTime < prayerTime) {
        return { prayer, time: prayerTime };
      }
    }
    
    // Se non c'è preghiera oggi, prendi la prima di domani
    if (prayers[0] && prayerTimes[prayers[0]]) {
      const [hours, minutes] = prayerTimes[prayers[0]].split(':').map(Number);
      const nextDayPrayer = new Date(cityTime);
      nextDayPrayer.setDate(nextDayPrayer.getDate() + 1);
      nextDayPrayer.setHours(hours, minutes, 0, 0);
      
      return { prayer: prayers[0], time: nextDayPrayer };
    }
    
    return { prayer: null, time: null };
  } catch (error) {
    console.error('Errore nel calcolo della prossima preghiera:', error);
    return { prayer: null, time: null };
  }
};

/**
 * Formatta un tempo in formato HH:MM:SS
 * @param {number} milliseconds - Millisecondi da formattare
 * @returns {string} Tempo formattato
 */
export const formatCountdown = (milliseconds) => {
  if (milliseconds <= 0) return '00:00:00';
  
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Ottiene l'ora locale della città con offset pre-calcolato
 * @param {number} offset - Offset in millisecondi
 * @returns {Date} Data/ora della città
 */
export const getCityTimeWithOffset = (offset) => {
  const now = new Date();
  return new Date(now.getTime() + offset);
};
