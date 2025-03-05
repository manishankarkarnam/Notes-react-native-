import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Modal, BackHandler, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // Import theme context
import AuthScreen from '../screens/AuthScreen';
import BiometricAuth from './BiometricAuth';

const AuthGuard = ({ navigation }) => {
  const { isAuthenticated, loading, requiresBioAuth, handleBioAuthSuccess, bioAuthPassed } = useAuth();
  const { theme } = useTheme(); // Get theme
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showLoading, setShowLoading] = useState(true);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);

  useEffect(() => {
    // Initial loading animation
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Short delay to show loading indicator
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Show biometric auth when required
  useEffect(() => {
    if (!loading && requiresBioAuth && !bioAuthPassed) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowBiometricAuth(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, requiresBioAuth, bioAuthPassed]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Navigate to the main app if authenticated
      navigation.replace('Tabs');
    }
  }, [isAuthenticated, loading, navigation]);
  
  // Handle back button press during biometric authentication
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showBiometricAuth) {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit the app?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() }
          ]
        );
        return true; // Prevent default back action
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showBiometricAuth]);

  const handleBiometricAuthSuccess = () => {
    setShowBiometricAuth(false);
    handleBioAuthSuccess();
  };
  
  const handleBiometricAuthCancel = () => {
    // When user cancels biometric auth, offer to quit app
    Alert.alert(
      "Authentication Required",
      "Biometric authentication is required to access the app. Do you want to exit?",
      [
        { text: "Try Again", style: "cancel", onPress: () => setShowBiometricAuth(true) },
        { text: "Exit App", style: "destructive", onPress: () => BackHandler.exitApp() }
      ]
    );
  };

  if (loading || showLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Show auth screen if not authenticated and not requiring biometric auth
  if (!isAuthenticated && !requiresBioAuth) {
    return <AuthScreen />;
  }

  // Show biometric auth modal if needed
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.background }]}>
      <Modal
        visible={showBiometricAuth}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          handleBiometricAuthCancel();
        }}
      >
        <BiometricAuth 
          onAuthenticated={handleBiometricAuthSuccess}
          onCancel={handleBiometricAuthCancel}
        />
      </Modal>
      {!showBiometricAuth && (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      )}
    </Animated.View>
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
});

export default AuthGuard;
