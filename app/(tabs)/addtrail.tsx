import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import {MaterialIcons} from '@expo/vector-icons';
import RecenterButton from '@/components/recenterBotton';
import SearchBar from '@/components/Searchbar';
import Tutorial from '@/components/Tutorial';
const AddTrail = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number;} | null>(null);

  const mapRef = React.useRef<MapView>(null);

  // Ottenere i permessi e la posizione dell'utente
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);
  
  if (!region) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MapView 
         ref={mapRef}
         style={styles.map}
         region={region}
         onRegionChangeComplete={(region) => setRegion(region)}
         mapType="terrain"
      >
        {/* Overlay per mappe topografiche */}
        <UrlTile urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

        {/* Marker per la posizione corrente */}
        {location && (
          <Marker coordinate={location}>
            <View style={styles.marker}>
              <View style={styles.innerCircle} />
            </View>
          </Marker>
        )}
      </MapView>
      <View style={styles.buttonGroup}>
        {/* Tree a sinistra */}
        <View style={styles.leftButtonContainer}>
        </View>

        {/* RecenterButton e Tutorial a destra */}
        <View style={styles.rightButtonContainer}>
          <RecenterButton location={location} setRegion={setRegion} />
          <Tutorial />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  rightButtonContainer: {
    alignItems: 'flex-end',
  },
  leftButtonContainer: {
    alignItems: 'flex-start',
  },
  buttonGroup: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
});

export default AddTrail;
