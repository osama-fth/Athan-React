import momentHijri from 'moment-hijri';

// Formato data per API senza dependency esterna
export const formatDateForAPI = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
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
