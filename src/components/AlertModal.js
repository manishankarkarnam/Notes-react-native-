import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const AlertModal = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
  type = 'default' // default, success, error, warning
}) => {
  const { theme, isDarkMode } = useTheme();
  const [animation] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      // Give haptic feedback based on alert type
      switch (type) {
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Get icon and color based on alert type
  const getTypeProperties = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'error', color: '#F44336' };
      case 'warning':
        return { icon: 'warning', color: '#FF9800' };
      default:
        return { icon: 'info', color: '#2196F3' };
    }
  };

  const typeProps = getTypeProperties();

  const getButtonStyle = (style) => {
    switch (style) {
      case 'destructive':
        return { color: '#F44336' };
      case 'cancel':
        return { color: theme.secondaryText };
      default:
        return { color: theme.accent };
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.container}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.alertBox,
                { 
                  backgroundColor: theme.card,
                  transform: [
                    { scale: animation },
                    {
                      translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }
                  ],
                  opacity: animation
                }
              ]}
            >
              {/* Alert Icon */}
              {type !== 'default' && (
                <View style={styles.iconContainer}>
                  <MaterialIcons name={typeProps.icon} size={32} color={typeProps.color} />
                </View>
              )}
              
              {/* Title */}
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              
              {/* Message */}
              {message && (
                <Text style={[styles.message, { color: theme.secondaryText }]}>
                  {message}
                </Text>
              )}
              
              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      index < buttons.length - 1 && styles.buttonMargin
                    ]}
                    onPress={() => {
                      if (button.onPress) button.onPress();
                      if (!button.preventDismiss) onDismiss();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text 
                      style={[
                        styles.buttonText,
                        getButtonStyle(button.style)
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center'
  },
  buttonMargin: {
    marginRight: 16
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default AlertModal;
