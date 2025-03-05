import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const BiometricAuth = ({ onAuthenticated, onCancel }) => {
  const { theme } = useTheme(); // Get current theme
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [isCompatible, setIsCompatible] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    checkDeviceForHardware();
  }, []);
  
  const checkDeviceForHardware = async () => {
    try {
      setIsChecking(true);
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsCompatible(compatible);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        // Determine the biometric type available
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else {
          setBiometricType('other');
        }
        
        // Automatically start authentication
        authenticate();
      } else {
        Alert.alert(
          "Not Supported",
          "Biometric authentication is not supported on this device.",
          [{ text: "OK", onPress: () => onAuthenticated() }]
        );
      }
    } catch (error) {
      console.error("Error checking biometric hardware:", error);
      Alert.alert(
        "Error",
        "There was an error checking for biometric hardware.",
        [{ text: "OK", onPress: () => onAuthenticated() }]
      );
    } finally {
      setIsChecking(false);
    }
  };
  
  const authenticate = async () => {
    try {
      setIsAuthenticating(true);
      
      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not Configured",
          "Biometric authentication has not been set up on this device.",
          [{ text: "OK", onPress: () => onAuthenticated() }]
        );
        return;
      }
      
      // Try to authenticate
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your notes',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAuthenticated();
      } else if (result.error === 'user_cancel') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // User explicitly cancelled
        if (onCancel) onCancel();
      } else {
        // Authentication failed, but not due to user cancellation
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Authentication Failed",
          "Please try again.",
          [
            { text: "Cancel", style: "cancel", onPress: () => onCancel && onCancel() },
            { text: "Try Again", onPress: () => authenticate() }
          ]
        );
      }
    } catch (error) {
      console.error("Error during biometric authentication:", error);
      Alert.alert(
        "Error",
        "An error occurred during authentication. Please try again.",
        [
          { text: "Cancel", style: "cancel", onPress: () => onCancel && onCancel() },
          { text: "Try Again", onPress: () => authenticate() }
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'face':
        return <MaterialIcons name="face" size={48} color="#536DFE" />;
      case 'fingerprint':
        return <MaterialIcons name="fingerprint" size={48} color="#536DFE" />;
      default:
        return <MaterialIcons name="lock" size={48} color="#536DFE" />;
    }
  };
  
  const getBiometricText = () => {
    switch (biometricType) {
      case 'face':
        return "Face Recognition";
      case 'fingerprint':
        return "Fingerprint";
      default:
        return "Biometric Authentication";
    }
  };
  
  if (isChecking) {
    return (
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }
  
  if (!isCompatible) {
    return null; // The alert will handle this case
  }
  
  return (
    <View style={styles.container}>
      <View style={[styles.authCard, { backgroundColor: theme.card }]}>
        <View style={styles.iconContainer}>
          {getBiometricIcon()}
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Authenticate</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
          Please authenticate using {getBiometricText()} to access your notes.
        </Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={authenticate}
          disabled={isAuthenticating}
        >
          <LinearGradient
            colors={['#4A67FF', '#536DFE']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="lock-open" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Authenticate</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel && onCancel()}
          disabled={isAuthenticating}
        >
          <Text style={[styles.cancelText, { color: theme.accent }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    marginTop: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    padding: 10,
  },
  cancelText: {
    color: '#536DFE',
    fontWeight: '500',
  },
});

export default BiometricAuth;
