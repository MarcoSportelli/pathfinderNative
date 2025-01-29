import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const Tree = () => {
    const [isClicked, setIsClicked] = useState(false);
    const tree = () => {
      
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
    };
  return (
    <TouchableOpacity style={[styles.button, isClicked && styles.clicked]} onPress={() => tree()}>
      <Text style={styles.text}>🌳</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: '#4caf50',
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  clicked: {
    backgroundColor: '#348637',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});

export default Tree;