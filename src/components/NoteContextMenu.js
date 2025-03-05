import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const NoteContextMenu = ({
  visible,
  onClose,
  position = { x: 0, y: 0 },
  note,
  onSelect,
  onPin,
  onFavorite,
  onDelete
}) => {
  const { theme } = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Give haptic feedback when opening menu
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate in
      Animated.timing(animValue, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      }).start();
    } else {
      // Animate out
      Animated.timing(animValue, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true
      }).start();
    }
  }, [visible]);
  
  // Calculate menu position based on touch position
  // Ensure menu stays within screen bounds
  const menuX = position.x > width - 200 ? width - 220 : position.x;
  const menuY = position.y > height - 250 ? position.y - 200 : position.y;
  
  const handleAction = (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    
    // Slight delay to allow menu to close smoothly before action
    setTimeout(() => {
      switch(action) {
        case 'select':
          onSelect && onSelect(note.id);
          break;
        case 'pin':
          onPin && onPin(note.id);
          break;
        case 'favorite':
          onFavorite && onFavorite(note.id);
          break;
        case 'delete':
          onDelete && onDelete(note.id);
          break;
        default:
          break;
      }
    }, 150);
  };
  
  const animatedStyles = {
    opacity: animValue,
    transform: [
      { scale: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1]
      }) }
    ]
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
          <Animated.View 
            style={[
              styles.menu, 
              { 
                top: menuY, 
                left: menuX,
                backgroundColor: theme.card,
              },
              animatedStyles
            ]}
          >
            <TouchableOpacity style={styles.option} onPress={() => handleAction('select')}>
              <MaterialIcons name="check-box-outline-blank" size={20} color="#536DFE" />
              <Text style={[styles.optionText, { color: theme.text }]}>Select</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.option} onPress={() => handleAction('pin')}>
              <MaterialIcons 
                name={note?.pinned ? "unpublished" : "push-pin"} 
                size={20} 
                color="#2196F3" 
              />
              <Text style={[styles.optionText, { color: theme.text }]}>
                {note?.pinned ? "Unpin" : "Pin"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.option} onPress={() => handleAction('favorite')}>
              <MaterialIcons 
                name={note?.favorite ? "star-outline" : "star"} 
                size={20} 
                color="#FFC107" 
              />
              <Text style={[styles.optionText, { color: theme.text }]}>
                {note?.favorite ? "Unfavorite" : "Favorite"}
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <TouchableOpacity style={styles.option} onPress={() => handleAction('delete')}>
              <MaterialIcons name="delete" size={20} color="#F44336" />
              <Text style={[styles.optionText, { color: "#F44336" }]}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    borderRadius: 8,
    paddingVertical: 6,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 15,
    marginLeft: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  }
});

export default NoteContextMenu;
