import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { View } from 'react-native';
import BiometricAuthService from '../utils/BiometricAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSetting, setSetting, SETTINGS_KEYS, initializeSettings } from '../utils/settingsStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biometricTypes, setBiometricTypes] = useState([]);

  // Check biometric availability and settings on component mount
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        // Initialize settings if needed
        await initializeSettings();
        
        // Check if device supports biometrics
        const available = await BiometricAuthService.isBiometricsAvailable();
        setIsBiometricsAvailable(available);
        
        if (available) {
          const types = await BiometricAuthService.getBiometricTypes();
          setBiometricTypes(types);
          
          // Check if user has enabled biometric authentication
          const enabled = await getSetting(SETTINGS_KEYS.BIOMETRIC_AUTH, false);
          setIsBiometricsEnabled(enabled);
          
          // If biometric auth is enabled, user needs to authenticate on first launch
          if (enabled) {
            // We'll authenticate in AuthGuard component
            setIsAuthenticated(false);
          } else {
            // No auth required
            setIsAuthenticated(true);
          }
        } else {
          // Device doesn't support biometrics, proceed without authentication
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error in biometric check:', error);
        setIsAuthenticated(true); // Default to authenticated if there's an error
      } finally {
        setLoading(false);
      }
    };
    
    checkBiometrics();
  }, []);

  // Authentication method that can be called from components
  const authenticate = useCallback(async (options = {}) => {
    try {
      // If biometrics aren't enabled or available, consider authenticated
      if (!isBiometricsEnabled || !isBiometricsAvailable) {
        setIsAuthenticated(true);
        return true;
      }
      
      // Attempt biometric authentication
      const result = await BiometricAuthService.authenticate({
        promptMessage: options.promptMessage || 'Authenticate to access your notes',
        cancelLabel: options.cancelLabel || 'Cancel',
        ...options
      });
      
      setIsAuthenticated(result);
      return result;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }, [isBiometricsAvailable, isBiometricsEnabled]);

  // Toggle biometric authentication on/off
  const toggleBiometrics = useCallback(async (enabled) => {
    try {
      if (enabled && !isBiometricsAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }
      
      // Directly use setSetting from the imported utility
      await setSetting(SETTINGS_KEYS.BIOMETRIC_AUTH, enabled);
      setIsBiometricsEnabled(enabled);
      
      return true;
    } catch (error) {
      console.error('Error toggling biometrics:', error);
      return false;
    }
  }, [isBiometricsAvailable]);

  // Log user in (set authenticated without biometrics)
  const login = async () => {
    setIsAuthenticated(true);
    return true;
  };

  // Log user out
  const logout = useCallback(async () => {
    setIsAuthenticated(false);
  }, []);

  const value = {
    isAuthenticated,
    isBiometricsAvailable,
    isBiometricsEnabled,
    biometricTypes,
    loading,
    authenticate,
    toggleBiometrics,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
