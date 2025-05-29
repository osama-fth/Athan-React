// src/screens/CitySearchScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, StyleSheet, SafeAreaView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../utils/TranslationContext';
import prayerService from '../services/prayerService';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const CitySearchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [recentCities, setRecentCities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Ottimizzazione: usa useCallback per le funzioni che vengono passate come props
  const loadRecentCities = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('recentCities');
      if (saved) {
        setRecentCities(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Errore nel caricamento delle città recenti:', error);
    }
  }, []);
  
  useEffect(() => {
    loadRecentCities();
  }, [loadRecentCities]);
  
  // Ottimizzazione: debounce per la ricerca
  const searchCities = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const cities = await prayerService.searchCity(trimmedQuery);
      setResults(cities);
    } catch (error) {
      console.error('Errore nella ricerca delle città:', error);
      Alert.alert(t('error'), t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [query, t]);
  
  const handleSelectCity = useCallback(async (city) => {
    try {
      await AsyncStorage.setItem('selectedCity', JSON.stringify(city));
      
      // Ottimizzazione: evita duplicati e limita a 5 città
      const updatedRecentCities = [
        city,
        ...recentCities.filter(c => c.id !== city.id)
      ].slice(0, 5);
      
      setRecentCities(updatedRecentCities);
      await AsyncStorage.setItem('recentCities', JSON.stringify(updatedRecentCities));
      
      navigation.navigate('Home');
    } catch (error) {
      console.error('Errore nel salvataggio della città:', error);
      Alert.alert(t('error'), t('clearDataError'));
    }
  }, [recentCities, navigation, t]);
  
  // Ottimizzazione: semplifica clearAllData
  const clearAllData = useCallback(async () => {
    Alert.alert(
      t('clearDataTitle'),
      t('clearDataConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: async () => {
            try {
              await prayerService.clearAllCache();
              await AsyncStorage.multiRemove(['selectedCity', 'recentCities']);
              setRecentCities([]);
              Alert.alert(t('success'), t('dataCleared'));
            } catch (error) {
              console.error('Errore durante la cancellazione:', error);
              Alert.alert(t('error'), t('clearDataError'));
            }
          },
          style: 'destructive'
        }
      ]
    );
  }, [t]);
  
  // Ottimizzazione: memoizza il render item
  const renderCityItem = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.cityItem} 
      onPress={() => handleSelectCity(item)}
    >
      <View style={styles.cityItemContent}>
        <Ionicons name="location" size={20} color={Colors.primary} style={styles.locationIcon} />
        <Text style={styles.cityName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  ), [handleSelectCity]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('enterCityName')}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchCities}
            />
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={searchCities}>
            <Text style={styles.searchButtonText}>{t('search')}</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <ActivityIndicator style={styles.loading} size="large" color={Colors.primary} />
        )}
        
        {results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>{t('searchResults')}</Text>
            <FlatList
              data={results}
              renderItem={renderCityItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        )}
        
        {recentCities.length > 0 && !loading && results.length === 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('recentCities')}</Text>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAllData}
              >
                <Text style={styles.clearButtonText}>
                  {t('clearAllData')}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentCities}
              renderItem={renderCityItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    marginVertical: 20,
  },
  resultsSection: {
    flex: 1,
  },
  recentSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.title,
  },
  listContainer: {
    paddingBottom: 20,
  },
  cityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationIcon: {
    marginRight: 10,
  },
  cityName: {
    fontSize: 16,
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CitySearchScreen;
