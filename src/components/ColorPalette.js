import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ColorPalette = ({ colors, selectedColor, onSelect }) => {
  return (
    <View style={styles.colorPalette}>
      {colors.map((color, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && styles.selectedColorOption
          ]}
          onPress={() => onSelect(color)}
        >
          {selectedColor === color && (
            <MaterialIcons 
              name="check" 
              size={16} 
              color={color === '#FFFFFF' ? '#000' : '#FFF'} 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#536DFE',
  },
});

export default ColorPalette;
