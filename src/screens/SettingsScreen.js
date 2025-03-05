import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Linking,
  Share,
  Platform,
  ActivityIndicator
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext'; // Import the Auth Context
import { useTheme } from '../context/ThemeContext'; // Import the theme context
import * as LocalAuthentication from 'expo-local-authentication';
import { getSetting, setSetting, SETTINGS_KEYS } from '../utils/settingsStore';
import { useAlert } from '../context/AlertContext'; // Add this import

const SETTINGS_KEY = 'app_settings';

const SettingsScreen = ({ navigation }) => {
  const { notes } = useNotes();
  const { 
    isBiometricsAvailable, 
    isBiometricsEnabled, 
    toggleBiometrics 
  } = useAuth(); // Use the Auth Context
  
  const { theme, isDarkMode, toggleTheme } = useTheme(); // Get theme context
  const alert = useAlert(); // Add this line to access the custom alert
  
  // Initialize settings state with default values
  const [settings, setSettings] = useState({
    enableDarkMode: isDarkMode, // Initialize with current theme state
    autoSave: true,
    enableSpellcheck: true,
    showPinnedAtTop: true,
  });
  
  // Additional state variables
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAuthEnabled, setBiometricAuthEnabled] = useState(false);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Stats values
  const stats = {
    totalNotes: notes.length,
    totalCategories: Array.from(new Set(notes.flatMap(note => note.tags || []))).length,
    storageUsed: `${Math.round((JSON.stringify(notes).length / 1024) * 10) / 10} KB`
  };
  
  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Update dark mode setting based on current theme
          setSettings({
            ...parsedSettings,
            enableDarkMode: isDarkMode
          });
        } else {
          // If no stored settings, initialize with current theme state
          setSettings(prev => ({
            ...prev,
            enableDarkMode: isDarkMode
          }));
        }
        
        // Start fade-in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [isDarkMode]);
  
  // Save settings to AsyncStorage
  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  const handleToggleSetting = (key) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Special handling for dark mode toggle
    if (key === 'enableDarkMode') {
      toggleTheme().then(isDarkMode => {
        const newSettings = { ...settings, enableDarkMode: isDarkMode };
        setSettings(newSettings);
        saveSettings(newSettings);
      });
      return;
    }
    
    // Special handling for autoSave toggle
    if (key === 'autoSave' && !settings[key]) {
      // When trying to enable autosave
      alert.showAlert({
        title: 'Coming Soon',
        message: 'The autosave feature will be available in a future update!',
        buttons: [{ text: 'OK' }]
      });
      return; // Don't toggle the setting
    }
    
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Handle toggling biometric authentication
  const handleToggleBiometrics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // If trying to enable biometrics but the device doesn't support it
      if (!isBiometricsEnabled && !isBiometricsAvailable) {
        alert.showErrorAlert(
          'Not Available',
          'Biometric authentication is not available on this device.'
        );
        return;
      }
      
      // If disabling biometrics, confirm with the user
      if (isBiometricsEnabled) {
        alert.showConfirmationAlert(
          'Disable Biometric Authentication',
          'Are you sure you want to disable biometric authentication? Your notes will no longer be protected.',
          async () => {
            const success = await toggleBiometrics(false);
            if (!success) {
              alert.showErrorAlert('Error', 'Failed to disable biometric authentication. Please try again.');
            }
          }
        );
      } else {
        // If enabling biometrics, toggle it immediately
        const success = await toggleBiometrics(true);
        
        if (!success) {
          alert.showErrorAlert(
            'Error',
            'Failed to enable biometric authentication. Please try again.'
          );
        }
      }
    } catch (error) {
      console.error('Error in toggleBiometrics:', error);
      alert.showErrorAlert('Error', 'An unexpected error occurred while changing biometric settings.');
    }
  };
  
  const handleExportNotes = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // In a real app, you would generate a file with notes data
      const notesData = await AsyncStorage.getItem('notes_data');
      
      if (!notesData) {
        alert.showWarningAlert('No Notes', 'There are no notes to export.');
        return;
      }
      
      // For demonstration, just share the data as text
      await Share.share({
        title: 'My Notes Export',
        message: `Notes Export\n\n${notesData}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert.showErrorAlert('Export Failed', 'Could not export notes data.');
    }
  };
  
  const handleClearAllNotes = () => {
    alert.showDestructiveAlert(
      'Clear All Notes',
      'Are you sure you want to permanently delete all notes? This cannot be undone.',
      async () => {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await AsyncStorage.removeItem('notes_data');
          alert.showSuccessAlert('Success', 'All notes have been deleted.');
        } catch (error) {
          console.error('Failed to delete notes:', error);
          alert.showErrorAlert('Error', 'Failed to delete notes.');
        }
      }
    );
  };

  const handleRestoreNotes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    alert.showAlert({
      title: 'Feature Coming Soon',
      message: 'The restore notes functionality will be available in a future update.',
      buttons: [{ text: 'OK' }]
    });
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing note-taking app!',
        title: 'Advanced Notes App',
        url: 'https://examplenotes.app',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const storeUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/idXXXXXXXXX' 
      : 'https://play.google.com/store/apps/details?id=com.example.notes';
    Linking.openURL(storeUrl);
  };

  const handleFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@examplenotes.app?subject=App Feedback');
  };

  // Update renderSetting function to use theme colors
  const renderSetting = (icon, title, description, toggle, value) => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
        <View style={[styles.settingIcon, { backgroundColor: `${theme.accent}20` }]}>
          <MaterialIcons name={icon} size={24} color={theme.accent} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
          {description && <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>{description}</Text>}
        </View>
      
      <Switch
        trackColor={{ false: "#CCCCCC", true: theme.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#CCCCCC"
        onValueChange={() => handleToggleSetting(toggle)}
        value={value}
      />
    </View>
  );

  const renderBiometricSetting = () => (
    <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: `${theme.accent}20` }]}>
        <MaterialIcons name="fingerprint" size={24} color={theme.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>Biometric Authentication</Text>
        <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>
          {isBiometricsAvailable 
            ? 'Secure your notes with biometrics' 
            : 'Biometrics not available on this device'}
        </Text>
      </View>
      <Switch
        trackColor={{ false: "#CCCCCC", true: theme.accent }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#CCCCCC"
        onValueChange={handleToggleBiometrics}
        value={isBiometricsEnabled}
        disabled={!isBiometricsAvailable}
      />
    </View>
  );

  const renderActionItem = (icon, title, description, onPress, destructive = false) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: theme.border }]} 
      onPress={onPress}
    >
      <View style={[styles.settingIcon, destructive ? styles.destructiveIcon : { backgroundColor: `${theme.accent}20` }]}>
        <MaterialIcons name={icon} size={24} color={destructive ? "#FF5252" : theme.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, destructive ? styles.destructiveText : { color: theme.text }]}>
          {title}
        </Text>
        {description && <Text style={[styles.settingDescription, { color: theme.secondaryText }]}>{description}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.statusBar} />
        <MaterialIcons name="settings" size={48} color={theme.secondaryText} />
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, paddingBottom: 80 }]}>
      <StatusBar style={theme.statusBar} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[styles.backButton, { backgroundColor: `${theme.secondaryText}20` }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 40 }}>
          {/* Empty view for alignment */}
          <Text style={{ opacity: 0 }}>.</Text>
        </View>
      </View>
      
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>App Settings</Text>
          
          {renderSetting('dark-mode', 'Dark Mode', 'Enable dark theme throughout the app', 'enableDarkMode', settings.enableDarkMode)}
          
          {renderSetting('save', 'Auto Save', 'Automatically save changes to notes', 'autoSave', settings.autoSave)}
          
          {/* Biometric authentication toggle */}
          {renderBiometricSetting()}
        </View>
        
        {/* Data Management - Removed Backup Notes option */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Data Management</Text>
          
          {renderActionItem('restore', 'Restore Notes', 'Restore from previous backup', handleRestoreNotes)}
          
          {renderActionItem('delete-forever', 'Clear All Notes', 'Permanently delete all notes', handleClearAllNotes, true)}
        </View>
        
        {/* Stats - Removed Last Backup section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>Stats</Text>
          
          <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalNotes}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Notes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalCategories}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{stats.storageUsed}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Storage</Text>
            </View>
          </View>
        </View>
        
        {/* About & Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>About & Support</Text>
          
          {renderActionItem('share', 'Share App', 'Tell your friends about this app', handleShareApp)}
          
          {renderActionItem('star', 'Rate App', 'Rate us on the app store', handleRate)}
          
          {renderActionItem('feedback', 'Send Feedback', 'Help us improve the app', handleFeedback)}
          
          <View style={[styles.versionContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.versionLabel, { color: theme.secondaryText }]}>Notes App v1.0.0</Text>
            <Text style={[styles.versionNumber, { color: theme.text }]}>© 2023 Notes App</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
    marginTop: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(83,109,254,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  destructiveIcon: {
    backgroundColor: 'rgba(255,82,82,0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  destructiveText: {
    color: '#FF5252',
  },
  settingDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  sortOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 56,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
  },
  selectedSortOption: {
    backgroundColor: '#536DFE',
  },
  sortOptionText: {
    color: '#757575',
    fontWeight: '500',
    fontSize: 14,
  },
  selectedSortOptionText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  versionContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  versionLabel: {
    fontSize: 14,
    color: '#757575',
  },
  versionNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginTop: 4,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#FFC107',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  comingSoonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
