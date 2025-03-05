import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for settings keys
export const SETTINGS_KEYS = {
  BIOMETRIC_AUTH: 'settings_biometric_auth',
  THEME: 'settings_theme',
  FONT_SIZE: 'settings_font_size',
  SORT_NOTES: 'settings_sort_notes',
  BACKUP_FREQUENCY: 'settings_backup_frequency',
};

// Get a setting value
export const getSetting = async (key, defaultValue = null) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

// Set a setting value
export const setSetting = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return false;
  }
};

// Default settings
export const DEFAULT_SETTINGS = {
  [SETTINGS_KEYS.BIOMETRIC_AUTH]: false,
  [SETTINGS_KEYS.THEME]: 'light',
  [SETTINGS_KEYS.FONT_SIZE]: 'medium',
  [SETTINGS_KEYS.SORT_NOTES]: 'date',
  [SETTINGS_KEYS.BACKUP_FREQUENCY]: 'weekly',
};

// Initialize settings if they don't exist
export const initializeSettings = async () => {
  try {
    const keys = Object.values(SETTINGS_KEYS);
    const promises = keys.map(async key => {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        await AsyncStorage.setItem(key, JSON.stringify(DEFAULT_SETTINGS[key]));
      }
    });
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error initializing settings:', error);
    return false;
  }
};
