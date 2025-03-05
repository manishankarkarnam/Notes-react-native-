import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const TagBadge = ({ 
  tag, 
  onRemove, 
  showRemoveButton = true, 
  style,
  size = 'medium'
}) => {
  const { theme } = useTheme();
  
  const sizeStyles = {
    small: {
      fontSize: 10,
      paddingVertical: 1,
      paddingHorizontal: 6,
    },
    medium: {
      fontSize: 12,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    large: {
      fontSize: 14,
      paddingVertical: 5,
      paddingHorizontal: 10,
    }
  };
  
  const tagSize = sizeStyles[size] || sizeStyles.medium;
  
  return (
    <View 
      style={[
        styles.tag,
        { 
          backgroundColor: theme.background, 
          borderColor: theme.border
        },
        style
      ]}
    >
      <Text 
        style={[
          styles.tagText, 
          { color: theme.secondaryText, fontSize: tagSize.fontSize },
        ]}
      >
        #{tag}
      </Text>
      
      {showRemoveButton && onRemove && (
        <TouchableOpacity 
          onPress={() => onRemove(tag)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.removeButton}
        >
          <MaterialIcons name="close" size={10} color={theme.secondaryText} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  tagText: {
    marginRight: 2,
  },
  removeButton: {
    padding: 2,
  }
});

export default TagBadge;
