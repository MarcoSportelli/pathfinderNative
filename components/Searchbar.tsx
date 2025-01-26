import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, FlatList, Keyboard, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Per gestire ricerche recenti
import { FontAwesome } from '@expo/vector-icons'; // Icona della lente di ingrandimento


const SearchBar = ({ mapRef }: { mapRef: React.RefObject<any> }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ name: string; coords: { latitude: number; longitude: number } }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Carica le ricerche recenti da AsyncStorage
  useEffect(() => {
    const loadRecentSearches = async () => {
      const storedSearches = await AsyncStorage.getItem('recentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    };
    loadRecentSearches();
  }, []);

  // Salva le ricerche recenti in AsyncStorage
  const updateRecentSearches = async (newSearch: any) => {
    const updatedSearches = [newSearch, ...recentSearches.filter((item) => item !== newSearch)].slice(0, 5);
    setRecentSearches(updatedSearches);
    await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  // Gestione input con debounce per ridurre richieste API
  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowDropdown(true);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      if (value.length > 0) {
        fetch(`https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1&limit=5&countrycodes=it`)
          .then((response) => response.json())
          .then((data) => {
            setSuggestions(
              data.map((item: { display_name: any; lat: string; lon: string; }) => ({
                name: item.display_name,
                coords: {
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                },
              }))
            );
          })
          .catch((error) => {
            console.error('Autocomplete error:', error);
            setSuggestions([]);
          });
      } else {
        setSuggestions([]);
      }
    }, 300); // Ritardo debounce 300ms
  };

  // Gestisce la ricerca e recentra la mappa
  const handleSearch = async (searchTerm: React.SetStateAction<string>) => {
    if (!mapRef?.current) {
      Alert.alert('Map not ready', 'The map is not ready yet. Please try again.');
      return;
    }

    setShowDropdown(false);
    const selectedSuggestion = suggestions.find((s) => s.name === searchTerm);

    if (selectedSuggestion) {
      mapRef.current.animateToRegion(
        {
          ...selectedSuggestion.coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
      updateRecentSearches(searchTerm);
    } else {
      // Cerca direttamente tramite Nominatim
      fetch(`https://nominatim.openstreetmap.org/search?q=${searchTerm}&format=json&addressdetails=1&limit=1`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            const coords = {
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
            };
            mapRef.current.animateToRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
            updateRecentSearches(searchTerm);
          } else {
            Alert.alert('Location not found', 'Please refine your search.');
          }
        })
        .catch((error) => {
          console.error('Error during search:', error);
          Alert.alert('Error', 'An error occurred while searching for the location.');
        });
    }

    setQuery(searchTerm);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor="#95a5a6"
            value={query}
            onChangeText={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onSubmitEditing={() => handleSearch(query)}
          />
        </View>
  
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(query)}>
          <FontAwesome name="search" size={20} color="#2c3e50" />
        </TouchableOpacity>
      </View>
  
      {showDropdown && (
        <View style={styles.dropdown}>
          {suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSearch(item.name)}>
                  <Text style={styles.suggestion}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSearch(item)}>
                  <Text style={styles.suggestion}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
  
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
    position: 'absolute',  // Posizionamento assoluto rispetto allo schermo
    top: '5%',            // Posiziona la barra più in basso sullo schermo
    left: '10%',           // Centratura orizzontale
    right: '10%',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa', // Colore chiaro di sfondo
    borderRadius: 30, // Bordi arrotondati
    paddingHorizontal: 20,
    height: 50, // Altezza più grande per un look moderno
    width: '100%', // Adattamento alla larghezza dello schermo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // Ombra per Android
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50', // Testo scuro
  },
  searchButton: {
    backgroundColor: '#fff', // Colore di sfondo bianco
    borderRadius: 50, // Forma circolare
    padding: 12,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4, // Ombra per Android
  },
  dropdown: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    color: '#34495e', // Testo scuro per i suggerimenti
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },  
});



export default SearchBar;
