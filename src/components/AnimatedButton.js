import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const AnimatedButton = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  iconRight = false,
  loading = false,
  disabled = false,
  buttonColor,
  textColor,
  iconColor,
  size = 'medium',
  hapticFeedback = true,
}) => {
  const { theme } = useTheme(); // Get current theme
  const [isPressing, setIsPressing] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  
  // Default to theme accent color if no buttonColor provided
  const actualButtonColor = buttonColor || theme.accent;
  const actualTextColor = textColor || '#FFFFFF';
  const actualIconColor = iconColor || actualTextColor;
  
  const handlePressIn = () => {
    setIsPressing(true);
    Animated.spring(scale, {
      toValue: 0.95,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const handlePressOut = () => {
    setIsPressing(false);
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  const getButtonSize = () => {
    switch(size) {
      case 'small': return { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12 };
      case 'large': return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
      default: return { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 };
    }
  };
  
  const buttonSizeStyles = getButtonSize();
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={disabled ? null : onPress}
        onPressIn={disabled ? null : handlePressIn}
        onPressOut={disabled ? null : handlePressOut}
        activeOpacity={0.9}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            paddingVertical: buttonSizeStyles.paddingVertical,
            paddingHorizontal: buttonSizeStyles.paddingHorizontal,
            backgroundColor: disabled ? theme.secondaryText : actualButtonColor,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={actualTextColor} />
        ) : (
          <View style={styles.contentContainer}>
            {icon && !iconRight && (
              <MaterialIcons 
                name={icon} 
                size={buttonSizeStyles.fontSize + 4} 
                color={actualIconColor} 
                style={styles.leftIcon} 
              />
            )}
            <Text 
              style={[
                styles.buttonText, 
                {
                  fontSize: buttonSizeStyles.fontSize,
                  color: disabled ? theme.background : actualTextColor,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconRight && (
              <MaterialIcons 
                name={icon} 
                size={buttonSizeStyles.fontSize + 4} 
                color={actualIconColor} 
                style={styles.rightIcon} 
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default AnimatedButton;
