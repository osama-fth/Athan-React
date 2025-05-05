import moment from 'moment-timezone';
import momentHijri from 'moment-hijri';

export const formatDateForAPI = (date) => {
  return moment(date).format('DD-MM-YYYY');
};

export const getHijriDate = (date) => {
  const hijriDate = momentHijri(date);
  return {
    day: hijriDate.iDate(),
    month: hijriDate.iMonth(),
    year: hijriDate.iYear(),
    monthName: hijriDate.format('iMMMM'),
  };
};

export const getNextPrayer = (prayerTimes, currentTime = new Date()) => {
  if (!prayerTimes) return null;
  
  const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const now = moment(currentTime);
  
  for (let prayer of prayers) {
    const prayerTime = moment(prayerTimes[prayer], 'HH:mm');
    if (now.isBefore(prayerTime)) {
      return { name: prayer, time: prayerTimes[prayer] };
    }
  }
  
  // Se tutte le preghiere sono passate, restituisci il fajr di domani
  return { name: 'fajr', time: prayerTimes.fajr, tomorrow: true };
};

export const calculateNextPrayer = (prayerTimes, cityTime) => {
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

// Formatta un countdown in formato HH:MM:SS
export const formatCountdown = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
