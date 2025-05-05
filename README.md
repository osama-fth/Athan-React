# 🕌 Athan - App per gli Orari di Preghiera

![Versione](https://img.shields.io/badge/versione-1.0.1-blue.svg)
![Piattaforma](https://img.shields.io/badge/piattaforma-iOS%20%7C%20Android-lightgrey.svg)

## 📱 Panoramica

**Athan** è un'applicazione mobile che fornisce orari precisi per le preghiere islamiche in qualsiasi città del mondo. Con un'interfaccia utente elegante e intuitiva, l'app ti aiuta a non perdere mai una preghiera.

## ✨ Funzionalità principali

- 🔍 **Ricerca città** in tutto il mondo
- ⏱️ **Countdown** alla prossima preghiera
- 📅 **Calendario islamico** (Hijri) integrato
- 🕰️ **Orari precisi** per tutte le preghiere giornaliere (Fajr, Dhuhr, Asr, Maghrib, Isha)
- 🌍 **Supporto fusi orari** automatico
- 📆 **Consultazione orari** per date passate e future
- 📱 **Design responsive** ottimizzato per tutti i dispositivi

## 🛠️ Tecnologie utilizzate

- [React Native](https://reactnative.dev/) - Framework per lo sviluppo mobile
- [Expo](https://expo.dev/) - Piattaforma per lo sviluppo React Native
- [React Navigation](https://reactnavigation.org/) - Navigazione tra schermate
- [Axios](https://axios-http.com/) - Client HTTP
- [Moment.js](https://momentjs.com/) e [Moment-Hijri](https://github.com/xsoh/moment-hijri) - Gestione date e calendario islamico
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - Persistenza dei dati

## 🚀 Installazione

### Prerequisiti

- Node.js (v14 o superiore)
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)

### Passaggi per l'installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/tuousername/athan-app.git
   cd athan-app
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   # oppure
   yarn install
   ```

3. Avvia l'applicazione:
   ```bash
   npm start
   # oppure
   yarn start
   ```

4. Scansiona il codice QR con l'app Expo Go sul tuo dispositivo o utilizza un emulatore.

## 📋 Utilizzo

### Ricerca di una città

1. Apri l'app e premi il pulsante "Cerca città"
2. Inserisci il nome della città e conferma
3. Seleziona la città corretta dai risultati

### Visualizzazione degli orari di preghiera

- La schermata principale mostra gli orari delle preghiere per la città selezionata
- Il timer in alto indica quanto tempo manca alla prossima preghiera
- Puoi cambiare la data per vedere gli orari di altri giorni

## 📂 Struttura del progetto

```
athan-app/
├── assets/            # Immagini e risorse statiche
├── src/
│   ├── components/    # Componenti riutilizzabili
│   ├── constants/     # Colori e traduzioni
│   ├── navigation/    # Configurazione della navigazione
│   ├── screens/       # Schermate dell'applicazione
│   ├── services/      # Servizi per API e calcoli
│   └── utils/         # Utilità e funzioni helper
└── App.js             # Punto di ingresso dell'applicazione
```

## 🔄 API utilizzate

- [Aladhan API](https://aladhan.com/prayer-times-api) - Per gli orari delle preghiere
- [OpenStreetMap Nominatim](https://nominatim.org/) - Per la ricerca delle città
- [GeoNames](https://www.geonames.org/) - Per i dati sui fusi orari
