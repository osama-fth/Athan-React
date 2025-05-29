import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Dimensions, SafeAreaView, StatusBar, Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../utils/TranslationContext';
import prayerService from '../services/prayerService';
import { getHijriDate } from '../utils/dateUtils';
import Colors from '../constants/Colors';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import ClockComponent from '../components/ClockComponent';
import TimerComponent from '../components/TimerComponent';
import { Animated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(null);
  
  // Stati per il selettore date
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Aggiungi questi stati per l'animazione
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
    
  // Carica città all'avvio
  useEffect(() => {
    loadCity();
  }, []);
  
  // Effetto per ricaricare al focus della schermata
  useFocusEffect(
    useCallback(() => {
      loadCity();
      return () => {};
    }, [])
  );
  
  // Effetto per città
  useEffect(() => {
    if (selectedCity) {
      console.log("Caricamento timezone per:", selectedCity.name);
      loadTimezone();
      loadPrayerTimes();
    }
  }, [selectedCity]);
  
  // Effetto per data
  useEffect(() => {
    if (selectedCity) {
      loadPrayerTimes();
    }
  }, [selectedDate]);
  
  const loadCity = async () => {
    try {
      const savedCity = await AsyncStorage.getItem('selectedCity');
      if (savedCity) {
        const cityData = JSON.parse(savedCity);
        if (!selectedCity || selectedCity.id !== cityData.id) {
          setSelectedCity(cityData);
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento della città:', error);
    }
  };
  
  const loadTimezone = async () => {
    try {
      setTimezone(null); // Resetta prima di caricare
      console.log("Richiesta timezone:", selectedCity.lat, selectedCity.lon);
      const tzData = await prayerService.getTimezone(selectedCity.lat, selectedCity.lon);
      console.log("Timezone ricevuto:", tzData);
      setTimezone(tzData);
    } catch (error) {
      console.error('Errore nel caricamento del fuso orario:', error);
    }
  };
  
  // Modifica la funzione loadPrayerTimes per includere l'animazione
  const loadPrayerTimes = async () => {
    // Prima esegui un'animazione di fade out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(async () => {
      // Dopo il fade out, carica i nuovi dati
      setLoading(true);
      try {
        const times = await prayerService.getPrayerTimes(selectedCity, selectedDate);
        setPrayerTimes(times);
      } catch (error) {
        console.error('Errore nel caricamento degli orari di preghiera:', error);
      } finally {
        setLoading(false);
        // Reimposta la posizione e la trasparenza per il fade in
        translateY.setValue(-10);
        
        // Esegui il fade in con i nuovi dati
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }
    });
  };
  
  const setToday = () => {
    setSelectedDate(new Date());
  };

  // Creiamo uno stile dinamico per la navbar che tiene conto degli insets
  const navbarStyle = {
    ...styles.navbar,
    paddingTop: Platform.OS === 'android' 
      ? insets.top > 0 ? insets.top + 8 : 20  // Aumentato da 15 a 20 e aggiunto +8 quando c'è un inset
      : 24,  // Aumentato da 15 a 24 per iOS
  };

  if (!selectedCity) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <SafeAreaView style={{ flex: 0, backgroundColor: Colors.primary }} />
        <SafeAreaView style={styles.safeArea}>
          {/* Navbar - spostata fuori dal container con padding */}
          <View style={navbarStyle}>
            <View style={styles.navbarLeft}>
              <FontAwesome5 name="mosque" size={24} color="white" style={styles.navbarIcon} />
              <Text style={styles.navbarTitle}>{t('title')}</Text>
            </View>
          </View>
          
          <View style={[
            styles.container, 
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }
          ]}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('selectCity')}</Text>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigation.navigate('CitySearch')}
              >
                <Text style={styles.buttonText}>{t('searchCity')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }
  
  // Formatta la data nel formato DD/MM/YYYY
  const formattedDate = selectedDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const hijriDate = getHijriDate(selectedDate);
  
  const prayers = [
    { id: 'fajr', name: t('fajr'), time: prayerTimes?.fajr },
    { id: 'sunrise', name: t('sunrise'), time: prayerTimes?.sunrise },
    { id: 'dhuhr', name: t('dhuhr'), time: prayerTimes?.dhuhr },
    { id: 'asr', name: t('asr'), time: prayerTimes?.asr },
    { id: 'maghrib', name: t('maghrib'), time: prayerTimes?.maghrib },
    { id: 'isha', name: t('isha'), time: prayerTimes?.isha }
  ];
  
  // Modifica il return per usare insets
  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 0, backgroundColor: Colors.primary }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={navbarStyle}>
          <View style={styles.navbarLeft}>
            <FontAwesome5 name="mosque" size={24} color="white" style={styles.navbarIcon} />
            <Text style={styles.navbarTitle}>{t('title')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.searchIcon}
            onPress={() => navigation.navigate('CitySearch')}
          >
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={[
            styles.container,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }
          ]}>
            {/* Timer Card */}
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>{t('timer')}</Text>
              <TimerComponent 
                prayerTimes={prayerTimes}
                timezone={timezone}
                prayerService={prayerService}
                nextPrayerCallback={(prayer) => setNextPrayer(prayer)}
                style={styles.timer}
              />
            </View>
            
            {/* Datepicker con react-native-modal-datetime-picker */}
            <View style={styles.dateRow}>
              {/* Label "Data:" */}
              <Text style={styles.dateLabel}>Data:</Text>
              
              {/* Container per il bottone che apre il DatePicker */}
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.datePickerButtonText}>{formattedDate}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.todayButton} onPress={setToday}>
                <Text style={styles.todayButtonText}>{t('today')}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Hijri Date */}
            <Text style={styles.hijriDate}>
              {hijriDate.day} {hijriDate.monthName} {hijriDate.year}
            </Text>
            
            {/* Modal DatePicker */}
            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={(date) => {
                setSelectedDate(date);
                setShowDatePicker(false);
              }}
              onCancel={() => {
                setShowDatePicker(false);
              }}
              confirmTextIOS="Conferma"
              cancelTextIOS="Annulla"
              headerTextIOS="Seleziona una data"
              locale="it-IT" // Per avere il calendario in italiano
              isDarkModeEnabled={false} // Forza il tema chiaro
              themeVariant="light" // Per iOS
              buttonTextColorIOS={Colors.primary} // Colore personalizzato per i pulsanti iOS
              backdropStyleIOS={{backgroundColor: 'rgba(0, 0, 0, 0.4)'}} // Sfondo semi-trasparente per iOS
              pickerContainerStyleIOS={{
                backgroundColor: 'white',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            />
            
            {/* Prayer Times Card */}
            <View style={styles.prayerCard}>
              <View style={styles.cityHeader}>
                <Text style={styles.cityName}>{selectedCity.name}</Text>
                <ClockComponent 
                  timezone={timezone} 
                  prayerService={prayerService} 
                  style={styles.cityTime} 
                />
              </View>
              
              {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loading} />
              ) : (
                <Animated.View 
                  style={[
                    styles.prayerList,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: translateY }]
                    }
                  ]}
                >
                  {prayers.map((prayer) => (
                    <View
                      key={prayer.id}
                      style={[
                        styles.prayerRow,
                        nextPrayer && nextPrayer === prayer.id && styles.nextPrayer
                      ]}
                    >
                      <Text 
                        style={[
                          styles.prayerName,
                          nextPrayer && nextPrayer === prayer.id && styles.nextPrayerText
                        ]}
                      >
                        {prayer.name}
                      </Text>
                      <Text 
                        style={[
                          styles.prayerTime,
                          nextPrayer && nextPrayer === prayer.id && styles.nextPrayerText
                        ]}
                      >
                        {prayer.time}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Realised by F. Osama</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  // Stili Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navbarTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchIcon: {
    padding: 8,
  },
  navbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navbarIcon: {
    marginRight: 8,
  },
  // Stili Timer Card
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 1,
    marginBottom: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timerLabel: {
    fontSize: 20,
    color: Colors.title,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.timer,
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: Colors.title,
  },
  todayButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  hijriDate: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
    marginBottom: 10,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Stili Prayer Card
  prayerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cityHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.title,
    marginBottom: 8,
  },
  cityTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  loading: {
    marginVertical: 30,
  },
  prayerList: {
    width: '100%',
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nextPrayer: {
    backgroundColor: Colors.nextPrayer,
    borderRadius: 8,
    marginVertical: 4,
  },
  nextPrayerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  prayerTime: {
    fontSize: 16,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Footer
  footer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textLight,
    fontSize: 12,
  },
  // Stili Datepicker diretto
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    color: Colors.title,
    marginRight: 10,
  },
});

export default HomeScreen;
