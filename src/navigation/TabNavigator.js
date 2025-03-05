import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext'; // Add this import

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoritesScreen from '../screens/FavoritesScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom Tab Bar Button with animation
const TabBarButton = ({ icon, isFocused, onPress }) => {
  const animatedValue = new Animated.Value(isFocused ? 1 : 0);
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);
  
  const buttonScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3], // Increased scale from 1.15 to 1.3 for more zoom effect
  });
  
  const handlePress = () => {
    onPress();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Animated.View 
        style={[
          styles.tabButtonContainer,
          { 
            transform: [{ scale: buttonScale }],
          }
        ]}
      >
        <MaterialIcons 
          name={icon} 
          size={24} 
          color={isFocused ? '#536DFE' : '#9E9E9E'} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme(); // Use hook inside component
  
  return (
    <View style={[styles.tabBarContainer, { backgroundColor: theme.background }]}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          
          return (
            <TabBarButton
              key={index}
              icon={options.tabBarIcon}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const TabNavigator = () => {
  // Use theme hook here too if needed
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: "home",
        }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{
          tabBarIcon: "star",
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: "settings",
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: "person",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 15, 
    left: 20,
    right: 20,
    height: 65, 
    elevation: 3,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.08,
    shadowRadius: 6, 
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 230, 230, 0.7)',
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: '100%',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 20,
    // Added a subtle background effect for active state
    backgroundColor: ({ isFocused }) => 
      isFocused ? 'rgba(83, 109, 254, 0.1)' : 'transparent',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default TabNavigator;
