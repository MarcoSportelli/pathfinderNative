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
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Search..."
          value={query}
          onChangeText={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onSubmitEditing={() => handleSearch(query)}
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(query)}>
          <FontAwesome name="search" size={20} color="#000" />
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
    top: 50,
    margin: 10,
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
  },
  searchButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  dropdown: {
    marginTop: 5,
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 2,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default SearchBar;
