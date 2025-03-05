import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
export const lightTheme = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#212121',
  secondaryText: '#757575',
  accent: '#536DFE',
  border: 'rgba(0,0,0,0.05)',
  statusBar: 'dark',
  headerBackground: '#FFFFFF',
  noteCardBackground: '#FFFFFF',
  inputBackground: 'rgba(255,255,255,1)',
  icon: '#757575',
};

export const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E0E0E0',
  secondaryText: '#BDBDBD',
  accent: '#536DFE',
  border: 'rgba(255,255,255,0.1)',
  statusBar: 'light',
  headerBackground: '#1E1E1E',
  noteCardBackground: '#2C2C2C',
  inputBackground: 'rgba(30,30,30,0.8)',
  icon: '#BDBDBD',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(lightTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme_preference');
        if (storedTheme !== null) {
          const themePreference = JSON.parse(storedTheme);
          setIsDarkMode(themePreference.isDarkMode);
          setTheme(themePreference.isDarkMode ? darkTheme : lightTheme);
        } else {
          // Use system preference if no stored preference
          const useDarkMode = systemColorScheme === 'dark';
          setIsDarkMode(useDarkMode);
          setTheme(useDarkMode ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemePreference();
  }, [systemColorScheme]);

  // Toggle theme function
  const toggleTheme = async () => {
    const newDarkModeSetting = !isDarkMode;
    setIsDarkMode(newDarkModeSetting);
    setTheme(newDarkModeSetting ? darkTheme : lightTheme);
    
    // Save theme preference
    try {
      await AsyncStorage.setItem(
        'theme_preference', 
        JSON.stringify({ isDarkMode: newDarkModeSetting })
      );
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
    
    return newDarkModeSetting;
  };

  // Wrap children in a View to prevent direct text rendering
  // This ensures all children are valid React Native components
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, isLoading }}>
      <View style={{ flex: 1 }}>
        {React.Children.map(children, child => 
          typeof child === 'string' ? null : child
        )}
      </View>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
