import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSetting, setSetting, SETTINGS_KEYS } from './settingsStore';

const SESSION_KEY = 'biometric_auth_session';
const SESSION_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds

class BiometricAuthService {
  // Check if biometric authentication is available on the device
  static async isBiometricsAvailable() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometrics availability:', error);
      return false;
    }
  }

  // Get the types of biometric authentication available
  static async getBiometricTypes() {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'face';
          default:
            return 'other';
        }
      });
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  // Check if biometric authentication is enabled in settings
  static async isBiometricsEnabled() {
    try {
      return await getSetting(SETTINGS_KEYS.BIOMETRIC_AUTH, false);
    } catch (error) {
      console.error('Error checking if biometrics is enabled:', error);
      return false;
    }
  }

  // Enable or disable biometric authentication
  static async setBiometricsEnabled(enabled) {
    try {
      // If enabling biometrics, validate with a biometric check first
      if (enabled) {
        const available = await this.isBiometricsAvailable();
        if (!available) {
          throw new Error('Biometric authentication is not available on this device');
        }
        
        // Test biometric authentication before enabling
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to enable biometric security',
          cancelLabel: 'Cancel',
        });
        
        if (!authResult.success) {
          throw new Error('Biometric authentication failed');
        }
      }
      
      // Use the imported setSetting function
      await setSetting(SETTINGS_KEYS.BIOMETRIC_AUTH, enabled);
      return true;
    } catch (error) {
      console.error('Error setting biometrics enabled:', error);
      throw error;
    }
  }

  // Authenticate with biometrics
  static async authenticate(options = {}) {
    try {
      // Check if biometrics is available and enabled
      const available = await this.isBiometricsAvailable();
      const enabled = await this.isBiometricsEnabled();
      
      // If not available or not enabled, consider authentication successful
      if (!available || !enabled) {
        return true;
      }
      
      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Authenticate to access your notes',
        cancelLabel: options.cancelLabel || 'Cancel',
        disableDeviceFallback: options.disableDeviceFallback !== undefined ? options.disableDeviceFallback : false,
      });
      
      return result.success;
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return false;
    }
  }
}

export default BiometricAuthService;
