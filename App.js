import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AppState } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext'; // Add this import
import { AlertProvider } from './src/context/AlertContext'; // Add this import

// Import navigation
import TabNavigator from './src/navigation/TabNavigator';

// Import screens that are not part of the tab navigator
import CreateNoteScreen from './src/screens/CreateNoteScreen';
import NoteDetailScreen from './src/screens/NoteDetailScreen';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';

// Import providers
import { NotesProvider } from './src/context/NotesContext';
import { AuthProvider } from './src/context/AuthContext';
import AuthGuard from './src/components/AuthGuard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider> {/* Add ThemeProvider at the top level */}
          <AuthProvider>
            <NotesProvider>
              <AlertProvider> {/* Add AlertProvider */}
                <BottomSheetModalProvider>
                  <NavigationContainer>
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="Auth" component={AuthGuard} />
                      <Stack.Screen name="Tabs" component={TabNavigator} />
                      <Stack.Screen 
                        name="CreateNote" 
                        component={CreateNoteScreen} 
                        options={{ presentation: 'modal', animationEnabled: true }}
                      />
                      <Stack.Screen 
                        name="NoteDetail" 
                        component={NoteDetailScreen} 
                        options={{ animationEnabled: true }}
                      />
                      <Stack.Screen 
                        name="Search" 
                        component={SearchScreen}
                        options={{ presentation: 'card', animationEnabled: true }}
                      />
                    </Stack.Navigator>
                  </NavigationContainer>
                </BottomSheetModalProvider>
              </AlertProvider>
            </NotesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
