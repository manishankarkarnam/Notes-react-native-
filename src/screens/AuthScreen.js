import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const AuthScreen = () => {
  const { authenticate, isBiometricsAvailable } = useAuth();
  const { theme, dark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate background first
    Animated.timing(backgroundAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Then animate the other elements
    Animated.stagger(200, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleAuthentication = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      // If biometrics are available, trigger authentication
      // If not, just proceed without biometric check
      await authenticate({
        skipBiometric: !isBiometricsAvailable
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const backgroundHeight = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.7, dark ? height * 0.35 : height * 0.5]
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Animated stylish background */}
      <Animated.View 
        style={[
          styles.backgroundContainer,
          { 
            height: backgroundHeight,
            borderBottomLeftRadius: 40, 
            borderBottomRightRadius: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 8,
          }
        ]}
      >
        <LinearGradient
          colors={dark ? ['#324180', '#3D4BA9'] : ['#4A67FF', '#536DFE']}
          style={[
            StyleSheet.absoluteFill, 
            { 
              borderBottomLeftRadius: 40, 
              borderBottomRightRadius: 40 
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Add subtle pattern overlay for more stylish look */}
          <View style={styles.patternOverlay} />
        </LinearGradient>
      </Animated.View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topSection}>
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: logoAnim,
                  transform: [
                    {
                      translateY: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LottieView
                source={require('../../assets/notes-animation.json')}
                autoPlay
                loop
                style={styles.logoAnimation}
              />
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.appTitle,
                {
                  color: '#FFFFFF',
                  opacity: titleAnim,
                  transform: [
                    {
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              Notes App
            </Animated.Text>
            
            <Animated.Text 
              style={[
                styles.appSubtitle,
                {
                  color: '#FDFDFD',
                  opacity: titleAnim,
                  transform: [
                    {
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              Keep your thoughts organized
            </Animated.Text>
          </View>
          
          <Animated.View 
            style={[
              styles.authCard,
              {
                backgroundColor: theme.inputBackground,
                opacity: cardAnim,
                transform: [
                  {
                    translateY: cardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>Welcome!</Text>
              <Text style={[styles.welcomeText, { color: theme.secondaryText }]}>
                {isBiometricsAvailable 
                  ? 'Secure your notes with biometric authentication' 
                  : 'Tap below to access your notes'}
              </Text>
            </View>
            
            {/* Single Authentication Button */}
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: theme.accent }]}
              onPress={handleAuthentication}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4A67FF', '#536DFE']}
                style={styles.authButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons 
                      name={isBiometricsAvailable ? "fingerprint" : "login"} 
                      size={24} 
                      color="#FFFFFF" 
                      style={styles.buttonIcon}
                    />
                    <Text style={[
                      styles.authButtonText, 
                      { color: '#FFFFFF' }
                    ]}>
                      {isBiometricsAvailable ? "Authenticate" : "Continue"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.privacyText, { color: theme.secondaryText }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    backgroundImage: 'radial-gradient(circle, #ffffff 10%, transparent 10.5%)',
    backgroundSize: '20px 20px',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  logoAnimation: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  authButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#536DFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  authButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonIcon: {
    marginRight: 12,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 20,
  },
  loadingAnimation: {
    width: 50,
    height: 50,
  },
});

export default AuthScreen;
