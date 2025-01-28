import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import SearchBar from '@/components/Searchbar';
import BottomSheet from '@gorhom/bottom-sheet';


const RecenterButton = ({ location, setRegion }: { location: { latitude: number; longitude: number } | null, setRegion: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void }) => {
  const [isClicked, setIsClicked] = useState(false);

  const recenterMap = () => {
    if (location) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <TouchableOpacity
      style={[
        styles.recenterButton,
        isClicked && styles.clicked,
      ]}
      onPress={recenterMap}
    >
      <MaterialIcons name="gps-fixed" size={24} color="white" />
    </TouchableOpacity>
  );
};


const MapWithTopoMap = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; } | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<{
    id: number;
    name: string;
    startpoint: { latitude: number; longitude: number };
    endpoint: { latitude: number; longitude: number };
    path: Array<{ latitude: number; longitude: number }>;
  } | null>(null);
  const [trailActive, setTrailActive] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-150)); // Posizione iniziale del popup
  
  const bottomSheetRef = useRef<BottomSheet>(null); // Ref per la Bottom Sheet
  const screenHeight = Dimensions.get('window').height;

  const mapRef = React.useRef<MapView>(null);

  // Ottieni la posizione dell'utente
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

  const trails = [
    {
      id: 1,
      name: 'Trail 1',
      startpoint: { latitude: 45.064, longitude: 7.692 },
      endpoint: { latitude: 45.065, longitude: 7.694 },
      path: [
        { latitude: 45.064, longitude: 7.692 },
        { latitude: 45.065, longitude: 7.694 },
      ],
    },
    {
      id: 2,
      name: 'Trail 2',
      startpoint: { latitude: 45.063, longitude: 7.690 },
      endpoint: { latitude: 45.062, longitude: 7.688 },
      path: [
        { latitude: 45.063, longitude: 7.690 },
        { latitude: 45.062, longitude: 7.688 },
      ],
    },
  ];
  

  const handleMarkerPress = (trail: typeof trails[0]) => {
    setSelectedTrail(trail);
  };
  const closeTrailPopup = () => {
    // Chiude il popup con animazione
    Animated.timing(slideAnim, {
      toValue: -150, // Nascondi il popup
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSelectedTrail(null));
  };

  const startTrail = () => {
    setTrailActive(true);
    closeTrailPopup(); // Chiudi il popup una volta iniziato il trail
  };

  const endTrail = () => {
    setTrailActive(false);
    setSelectedTrail(null);
  };

  const closeModal = () => {
    setSelectedTrail(null);
  };


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

        <SearchBar mapRef={mapRef} />

        {/* Marker per la posizione corrente */}
        {location && (
          <Marker coordinate={location}>
            <View style={styles.marker}>
              <View style={styles.innerCircle} />
            </View>
          </Marker>
        )}

        {/* Marker per ogni trail */}
        {trails.map((trail) => (
          <Marker
            key={trail.id}
            coordinate={trail.startpoint}
            onPress={() => handleMarkerPress(trail)}
          />
        ))}

        {/* Polyline per il trail selezionato o attivo */}
        {trailActive && selectedTrail && (
          <Polyline coordinates={selectedTrail.path} strokeColor="blue" strokeWidth={4} />
        )}
      </MapView>

      {/* Bottone per terminare il trail */}
      {trailActive && (
        <TouchableOpacity style={styles.endTrailButton} onPress={endTrail}>
          <Ionicons name="stop" size={24} color="white" />
        </TouchableOpacity>
      )}

       {/* Bottom sheet modal */}
       {selectedTrail && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={!!selectedTrail}
          onRequestClose={closeModal}
          presentationStyle='overFullScreen'
        >
          <View style={styles.modalContainer}>
            <View style={styles.bottomSheet}>
              <Text style={styles.trailName}>{selectedTrail.name}</Text>
              <Text>Vuoi iniziare questo trail?</Text>
              <TouchableOpacity style={styles.button} onPress={closeModal}>
                <Text style={styles.buttonText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Bottone per recentrare la mappa */}
      <RecenterButton location={location} setRegion={setRegion} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  trailPopup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Sfondo trasparente
  },
  bottomSheet: {
    width: '100%',
    height: 200, // Altezza della tendina
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  trailName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF6F61',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  endTrailButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'red',
    borderRadius: 50,
    padding: 10,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#3498db',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  clicked: {
    backgroundColor: '#1f78b4',
  },
});

export default MapWithTopoMap;
