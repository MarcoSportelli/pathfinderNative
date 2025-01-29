import React, { useState, useEffect, useRef, act } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SearchBar from '@/components/Searchbar';
import RecenterButton from '@/components/recenterBotton';

import Tree from '@/components/Tree';
import Tutorial from '@/components/Tutorial'; 

const MapWithTopoMap = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [selectedTrail, setSelectedTrail] = useState<{ id: number; name: string; startpoint: { latitude: number; longitude: number; }; endpoint: { latitude: number; longitude: number; }; path: { latitude: number; longitude: number; }[]; } | null>(null);
  const [trailActive, setTrailActive] = useState(false);
  const [simulatedPosition, setSimulatedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);
  const [refresch, setRefresch] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");

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
  }, [refresch]);

  const trails = [
    {
      id: 1,
      name: 'Trail 1',
      startpoint: { latitude: 45.064, longitude: 7.692 },
      endpoint: { latitude: 45.070, longitude: 7.698 },
      path: [
        { latitude: 45.064, longitude: 7.692 },
        { latitude: 45.065, longitude: 7.693 },
        { latitude: 45.066, longitude: 7.694 },
        { latitude: 45.067, longitude: 7.695 },
        { latitude: 45.068, longitude: 7.696 },
        { latitude: 45.069, longitude: 7.697 },
        { latitude: 45.070, longitude: 7.698 },
      ],
    },
    {
      id: 2,
      name: 'Trail 2',
      startpoint: { latitude: 45.063, longitude: 7.690 },
      endpoint: { latitude: 45.062, longitude: 7.680 },
      path: [
        { latitude: 45.063, longitude: 7.690 },
        { latitude: 45.063, longitude: 7.689 },
        { latitude: 45.063, longitude: 7.688 },
        { latitude: 45.063, longitude: 7.687 },
        { latitude: 45.063, longitude: 7.686 },
        { latitude: 45.063, longitude: 7.685 },
        { latitude: 45.063, longitude: 7.684 },
        { latitude: 45.063, longitude: 7.683 },
        { latitude: 45.062, longitude: 7.682 },
        { latitude: 45.062, longitude: 7.681 },
        { latitude: 45.062, longitude: 7.680 },
      ],
    },
  ];

  const handleMarkerPress = (trail: React.SetStateAction<{ id: number; name: string; startpoint: { latitude: number; longitude: number; }; endpoint: { latitude: number; longitude: number; }; path: Array<{ latitude: number; longitude: number; }>; } | null>) => {
    setSelectedTrail(trail);
    setModalVisible(true);
  };

  const startTrail = () => {
    console.log('Starting trail:', selectedTrail?.name);
    setTrailActive(true);
    setSimulatedPosition(selectedTrail?.path[0] || null);
    setModalVisible(false);
  };

  const endTrail = () => {
    setReviewModalVisible(true);
  };
  const submitReview = () => {
    console.log("Recensione inviata:", reviewText);
    setReviewModalVisible(false);
    setReviewText(""); // Resetta il campo della recensione
    setTrailActive(false);
    setSelectedTrail(null);
    setSimulatedPosition(null);
    setRefresch((r) => !r);
  };

  useEffect(() => {
    let timerId: string | number | NodeJS.Timeout | null | undefined = null;
  
    if (trailActive && selectedTrail) {
      const path = selectedTrail.path;
      let index = 0;
  
      const speedMetersPerSecond = 10 * 1000 / 3600; // 4 km/h in metri al secondo
  
      const moveToNextPoint = () => {
        if (index < path.length - 1) {
          const currentPosition = path[index];
          const nextPosition = path[index + 1];
  
          // Calcola la distanza tra i due punti
          const distance = calculateDistance(currentPosition, nextPosition);
          const travelTime = (distance / speedMetersPerSecond) * 1000; // Tempo necessario in millisecondi
  
          setSimulatedPosition(nextPosition); // Aggiorna la posizione dell'utente
  
          index++;
  
          // Passa al prossimo punto dopo il tempo calcolato
          timerId = setTimeout(moveToNextPoint, travelTime);
        } else {
          console.log("Raggiunto l'endpoint!");
          endTrail(); 
        }
      };
  
      moveToNextPoint();
  
      return () => clearTimeout(timerId); // Pulizia
    }
  }, [trailActive, selectedTrail]);

  const closeModal = (flag: boolean) => {
    setModalVisible(false);
    if (flag){
      setTrailActive(false);
      setSelectedTrail(null);
      setSimulatedPosition(null);
      setRefresch((r) => !r);
    }
  };

  const calculateDistance = (pointA: { latitude: any; longitude: any; }, pointB: { latitude: any; longitude: any; }) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371e3;
    const lat1 = toRadians(pointA.latitude);
    const lon1 = toRadians(pointA.longitude);
    const lat2 = toRadians(pointB.latitude);
    const lon2 = toRadians(pointB.longitude);
    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };


  if (!region) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MapView showsCompass={false} ref={mapRef} style={styles.map} region={region} onRegionChangeComplete={(region) => setRegion(region)} mapType="terrain" >
        {/* Overlay per mappe topografiche */}
        <UrlTile urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <SearchBar mapRef={mapRef} />

        {/* Marker per la posizione corrente */}
        {!simulatedPosition && location && (
          <Marker coordinate={location}>
            <View style={styles.marker}>
              <View style={styles.innerCircle} />
            </View>
          </Marker>
        )}

        {/* Marker per ogni trail */}
        {trails.map((trail) => ( 
          <Marker key={trail.id} coordinate={trail.startpoint} flat={true}  onPress={() => handleMarkerPress(trail)} >
            <View style={styles.markerBike}>
              <MaterialCommunityIcons name="bike" size={24} color="white" />
            </View>
          </Marker> 
        ))}

        {/* Polyline per il trail selezionato o attivo */}
        {selectedTrail && <Polyline coordinates={selectedTrail.path} strokeColor="blue" strokeWidth={4} />}
        {simulatedPosition && 
        <Marker coordinate={simulatedPosition}>
          <View style={styles.marker}>
            <View style={styles.innerCircle} />
          </View>
        </Marker>
        }

      </MapView>

      {/* Bottone per terminare il trail */}
      {trailActive && (
        <TouchableOpacity style={styles.endTrailButton} onPress={endTrail}>
          <Ionicons name="stop" size={24} color="white" />
        </TouchableOpacity>
      )}


      {/* Modal per inserire la review */}
      <ReviewModal reviewModalVisible={reviewModalVisible} reviewText={reviewText} setReviewText={setReviewText} submitReview={submitReview} />

      {/* Bottom sheet modal */}
      {modalVisible && ( <Popup selectedTrail={selectedTrail} startTrail={startTrail} closeModal={closeModal} /> )}

      {!modalVisible && ( <BottomSheet location={location} setRegion={setRegion} />)} 
      
    </View>
  );
};


interface ReviewModalProps {
  reviewModalVisible: boolean;
  reviewText: string;
  setReviewText: (text: string) => void;
  submitReview: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ reviewModalVisible, reviewText, setReviewText, submitReview }) => {
  return(
    <Modal visible={reviewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Lascia una recensione</Text>
            <TextInput
              style={styles.input}
              placeholder="Scrivi la tua recensione qui..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline={true}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={submitReview}>
                <Text style={styles.buttonText}>Invia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => submitReview()}
              >
                <Text style={styles.buttonText}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  );
};

interface BottomSheetProps {
  location: { latitude: number; longitude: number } | null;
  setRegion: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>>;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ location, setRegion }) => {
  return(
    <View style={styles.buttonGroup}>
        {/* Tree a sinistra */}
        <View style={styles.leftButtonContainer}>
          <Tree/>
        </View>

        {/* RecenterButton e Tutorial a destra */}
        <View style={styles.rightButtonContainer}>
          <RecenterButton location={location} setRegion={setRegion} />
          <Tutorial />
        </View>
      </View>
  );
}

interface PopupProps {
  selectedTrail: {
    id: number;
    name: string;
    startpoint: { latitude: number; longitude: number };
    endpoint: { latitude: number; longitude: number };
    path: Array<{ latitude: number; longitude: number }>;
  } | null;
  startTrail: () => void;
  closeModal: (flag: boolean) => void;
}


const Popup: React.FC<PopupProps> = ({ selectedTrail, startTrail, closeModal }: PopupProps & { closeModal: (flag: boolean) => void }) => {
  return(
    <View style={styles.popupContainer}>
      <View style={styles.popup}>
        <Text style={styles.trailName}>{selectedTrail?.name}</Text>
        <Text>Vuoi iniziare questo trail?</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => startTrail()}> 
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => closeModal(true)}>
            <Text style={styles.buttonText}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerBike: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: "red",
    justifyContent: 'center',
    alignItems: 'center',
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
  popupContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, 
  },
  popup: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#FF3B30', // Rosso per il pulsante Chiudi
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

  button: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    marginTop: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
 
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  endTrailButton: {
    position: 'absolute',
    bottom: 200,
    left: 30,
    backgroundColor: 'red',
    borderRadius: 50,
    padding: 10,
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
  leftButtonContainer: {
    alignItems: 'flex-start',
  },
  rightButtonContainer: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },

});


export default MapWithTopoMap;