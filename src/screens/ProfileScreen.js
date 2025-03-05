import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Switch // Add this import
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNotes } from '../context/NotesContext';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 
import { useAlert } from '../context/AlertContext'; 


// Key for storing user profile data
const USER_PROFILE_KEY = 'user_profile_data';

// Replace the avatar URLs with local image references
const avatarOptions = [
  { id: 1, source: require('../../assets/inbuilt_avatars/1.jpg') },
  { id: 2, source: require('../../assets/inbuilt_avatars/2.jpg') },
  { id: 3, source: require('../../assets/inbuilt_avatars/3.jpg') },
  { id: 4, source: require('../../assets/inbuilt_avatars/4.jpg') },
  { id: 5, source: require('../../assets/inbuilt_avatars/5.jpg') },
  { id: 6, source: require('../../assets/inbuilt_avatars/6.jpg') },
  { id: 7, source: require('../../assets/inbuilt_avatars/7.jpg') }, // Fixed ID
  { id: 8, source: require('../../assets/inbuilt_avatars/8.jpg') }, // Fixed ID
  { id: 9, source: require('../../assets/inbuilt_avatars/9.jpg') }, // Fixed ID
  { id: 10, source: require('../../assets/inbuilt_avatars/0.jpg') }, // Fixed ID
];

const ProfileScreen = ({ navigation }) => {
  const { notes } = useNotes();
  const { logout, isBiometricsEnabled } = useAuth();
  const { theme, toggleTheme } = useTheme(); // Add this line
  const alert = useAlert(); // Add this line
  
  // Default user data
  const defaultUser = {
    name: 'Guest User',
    avatar: 1, // Default to first avatar
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
  
  // User state with default values
  const [user, setUser] = useState(defaultUser);
  
  // Edit profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // NEW: Separate state for name editing with proper initialization
  const [nameInput, setNameInput] = useState('');
  const nameInputRef = useRef(null);
  
  // Avatar selection modal state
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  
  // Load user profile from AsyncStorage when component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (storedProfile) {
          setUser(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);

  // Save user profile to AsyncStorage
  const saveUserProfile = async (updatedProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  };
  
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(profileAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Calculate statistics based on notes data
  const totalNotes = notes.length;
  const pinnedNotes = notes.filter(note => note.pinned).length;
  const favoriteNotes = notes.filter(note => note.favorite).length;
  const categories = Array.from(new Set(notes.flatMap(note => note.tags || []))).length;
  const notesThisMonth = notes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const today = new Date();
    return noteDate.getMonth() === today.getMonth() && 
           noteDate.getFullYear() === today.getFullYear();
  }).length;
  
  // NEW: Updated handle profile edit to properly initialize the name input
  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditModalVisible(true);
  };

  // Handle opening avatar selection modal
  const handleOpenAvatarModal = () => {
    setSelectedAvatar(user.avatar); // Pre-select current avatar
    setAvatarModalVisible(true);
    setEditModalVisible(false); // Close the main edit modal
  };

  // Handle avatar selection
  const handleSelectAvatar = async (avatar) => {
    setSelectedAvatar(avatar);
  };

  // Handle avatar selection confirmation - update to handle custom avatars
  const handleConfirmAvatar = async () => {
    if (!selectedAvatar) return;
    
    // Update user with selected avatar
    const updatedUser = {
      ...user,
      avatar: selectedAvatar,
      isCustomAvatar: typeof selectedAvatar === 'string' && 
                      (selectedAvatar.startsWith('file:') || selectedAvatar.startsWith('content:'))
    };
    
    // Save to AsyncStorage
    const success = await saveUserProfile(updatedUser);
    
    if (success) {
      // Update state with new avatar
      setUser(updatedUser);
      setAvatarModalVisible(false);
      setEditModalVisible(true); // Re-open the main edit modal
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      alert.showErrorAlert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  // Handle picking image from device
  const handlePickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert.showErrorAlert(
        'Permission Denied', 
        'We need camera roll permission to let you select an avatar.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Store the URI directly as the avatar selection
        const imageUri = result.assets[0].uri;
        setSelectedAvatar(imageUri);
        
        // Update user immediately with the custom avatar
        const updatedUser = {
          ...user,
          avatar: imageUri, // Store URI directly for custom avatars
          isCustomAvatar: true // Flag to distinguish between IDs and URIs
        };
        
        const success = await saveUserProfile(updatedUser);
        if (success) {
          setUser(updatedUser);
          setAvatarModalVisible(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          alert.showErrorAlert('Error', 'Failed to save custom avatar.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert.showErrorAlert('Error', 'Failed to select image from your device.');
    }
  };
  
  // Handle theme change
  const handleThemeChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alert.showAlert({
      title: 'Theme Settings',
      message: 'Theme customization is coming soon!'
    });
  };
  
  // Handle security settings
  const handleSecuritySettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    alert.showAlert({
      title: 'Security Settings',
      message: 'Security settings are coming soon!'
    });
  };

  // Handle lock/logout
  const handleLock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isBiometricsEnabled) {
      logout();
      // This will force re-authentication through AuthGuard
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  // Avatar Selection Modal Component with dark mode support
  const AvatarSelectionModal = () => (
    <Modal
      visible={avatarModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setAvatarModalVisible(false);
        setEditModalVisible(true); // Re-open the main edit modal
      }}
    >
      <SafeAreaView style={[styles.avatarModalContainer, { backgroundColor: theme.background }]}>
        <View style={[
          styles.avatarModalHeader, 
          { 
            backgroundColor: theme.background,
            borderBottomColor: theme.border 
          }
        ]}>
          <TouchableOpacity 
            onPress={() => {
              setAvatarModalVisible(false);
              setEditModalVisible(true); // Re-open the main edit modal
            }} 
            style={styles.avatarModalBackButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.icon} />
          </TouchableOpacity>
          <Text style={[styles.avatarModalTitle, { color: theme.text }]}>Choose Avatar</Text>
          <TouchableOpacity 
            onPress={handleConfirmAvatar} 
            style={styles.avatarModalDoneButton}
          >
            <Text style={[styles.avatarModalDoneText, { color: theme.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.selectedAvatarContainer, { borderBottomColor: theme.border }]}>
          <Image 
            source={getAvatarSource(selectedAvatar || user.avatar)} 
            style={styles.selectedAvatarImage} 
          />
          <Text style={[styles.selectedAvatarLabel, { color: theme.secondaryText }]}>Selected Avatar</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.pickFromDeviceButton, { backgroundColor: theme.buttonBackground }]}
          onPress={handlePickImage}
        >
          <MaterialIcons name="image" size={22} color={theme.accent} />
          <Text style={[styles.pickFromDeviceText, { color: theme.accent }]}>Choose from Device</Text>
        </TouchableOpacity>
        
        <Text style={[styles.predefinedAvatarsTitle, { color: theme.text }]}>Predefined Avatars</Text>
        
        <FlatList
          data={avatarOptions}
          keyExtractor={(item) => item.id.toString()}
          numColumns={4}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.avatarOption,
                selectedAvatar === item.id && styles.selectedAvatarOption
              ]}
              onPress={() => handleSelectAvatar(item.id)}
            >
              <Image source={item.source} style={styles.avatarOptionImage} />
              {selectedAvatar === item.id && (
                <View style={styles.selectedAvatarOverlay}>
                  <MaterialIcons name="check" size={24} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.avatarGridContainer}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );

  // NEW: Completely rebuild the Edit Profile Modal component with dark mode support
  const EditProfileModal = () => {
    // Use local state for input tracking within the modal component
    const [localNameInput, setLocalNameInput] = useState(user.name);
    
    // Focus the input field when modal appears
    useEffect(() => {
      if (editModalVisible) {
        setTimeout(() => {
          if (nameInputRef.current) {
            nameInputRef.current.focus();
          }
        }, 300);
      }
    }, [editModalVisible]);
    
    // Save handler that uses the local state
    const handleSaveChanges = async () => {
      if (!localNameInput.trim()) {
        alert.showWarningAlert('Invalid Name', 'Please enter a valid name.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const updatedUser = {
        ...user,
        name: localNameInput.trim()
      };
      
      const success = await saveUserProfile(updatedUser);
      
      if (success) {
        setUser(updatedUser);
        setEditModalVisible(false);
      } else {
        alert.showErrorAlert('Error', 'Failed to save profile changes.');
      }
    };
    
    return (
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            
            <View style={styles.avatarSection}>
              <Image source={getAvatarSource(user.avatar)} style={styles.modalAvatar} />
              <TouchableOpacity 
                style={[styles.changeAvatarButton, { backgroundColor: theme.buttonBackground }]}
                onPress={handleOpenAvatarModal}
              >
                <Text style={[styles.changeAvatarText, { color: theme.accent }]}>Change Avatar</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>Name</Text>
            <View style={[styles.nameInputWrapper, { 
              backgroundColor: theme.inputBackground, 
              borderColor: theme.border 
            }]}>
              <TextInput
                ref={nameInputRef}
                style={[styles.nameInput, { color: theme.text }]}
                value={localNameInput}
                onChangeText={setLocalNameInput}
                placeholder="Enter your name"
                placeholderTextColor={theme.secondaryText}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveChanges}
                blurOnSubmit={false}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.cancelButton, 
                  { backgroundColor: theme.buttonBackground }
                ]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Get the avatar source from the avatarOptions array
  const getAvatarSource = (avatarId) => {
    // If it's a string and looks like a URI, it's a custom avatar
    if (typeof avatarId === 'string' && (avatarId.startsWith('file:') || avatarId.startsWith('content:'))) {
      return { uri: avatarId };
    }
    
    // Otherwise it's one of our predefined avatars with numeric ID
    const avatar = avatarOptions.find(a => a.id === avatarId);
    return avatar ? avatar.source : avatarOptions[0].source; // Default to first avatar if not found
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim, backgroundColor: theme.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleSelectAvatar} activeOpacity={0.8}>
            <Image source={getAvatarSource(user.avatar)} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
          <Text style={[styles.memberSince, { color: theme.secondaryText }]}>Member since {user.joinDate}</Text>
          
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.card }]}
            onPress={handleEditProfile}
          >
            <MaterialIcons name="edit" size={20} color={theme.accent} />
            <Text style={[styles.editButtonText, { color: theme.accent }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Only show lock button if biometrics is enabled */}
        {isBiometricsEnabled && (
          <TouchableOpacity 
            style={styles.lockButton}
            onPress={handleLock}
          >
            <MaterialIcons name="lock" size={22} color={theme.accent} />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <Animated.View 
          style={[
            styles.statsContainer,
            { opacity: statsAnim, backgroundColor: theme.card }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>{totalNotes}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Total Notes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>{pinnedNotes}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Pinned</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>{favoriteNotes}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.accent }]}>{categories}</Text>
              <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Tags</Text>
            </View>
          </View>
          
          <View style={styles.monthlyStats}>
            <View style={styles.monthlyStatItem}>
              <Text style={[styles.monthlyStatValue]}>{notesThisMonth}</Text>
              <Text style={[styles.monthlyStatLabel, { color: theme.secondaryText }]}>Notes created this month</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Actions */}
        <Animated.View
          style={[
            styles.actionsContainer,
            { opacity: actionsAnim, backgroundColor: theme.card }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={handleThemeChange}
          >
            <MaterialIcons name="palette" size={24} color={theme.accent} />
            <Text style={[styles.actionText, { color: theme.text }]}>Change Theme</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={handleSecuritySettings}
          >
            <MaterialIcons name="security" size={24} color={theme.accent} />
            <Text style={[styles.actionText, { color: theme.text }]}>Security Settings</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.icon} />
          </TouchableOpacity>
          
          <View style={styles.appInfoContainer}>
            <Text style={[styles.appVersionText, { color: theme.secondaryText }]}>Notes App v1.0</Text>
            <Text style={[styles.appCopyrightText, { color: theme.secondaryText }]}>© 2023 Notes App</Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <EditProfileModal />
      
      {/* Avatar Selection Modal */}
      <AvatarSelectionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#536DFE',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  memberSince: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#536DFE',
    marginLeft: 8,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    width: '25%', 
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#536DFE',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  monthlyStats: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
    marginTop: 8,
  },
  monthlyStatItem: {
    alignItems: 'center',
  },
  monthlyStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00CC00',
  },
  monthlyStatLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  actionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 100, // Extra space for the bottom tab bar
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 16,
    flex: 1,
  },
  appInfoContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  appVersionText: {
    fontSize: 14,
    color: '#757575',
  },
  appCopyrightText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 24,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changeAvatarButton: {
    backgroundColor: '#F1F3FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  changeAvatarText: {
    color: '#536DFE',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  textInputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#F1F3FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F3FA',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#757575',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#536DFE',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Avatar modal styles
  avatarModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarModalBackButton: {
    padding: 6,
  },
  avatarModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  avatarModalDoneButton: {
    padding: 6,
  },
  avatarModalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#536DFE',
  },
  selectedAvatarContainer: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  selectedAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#536DFE',
  },
  selectedAvatarLabel: {
    fontSize: 14,
    color: '#757575',
  },
  pickFromDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3FA',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 12,
  },
  pickFromDeviceText: {
    fontSize: 16,
    color: '#536DFE',
    marginLeft: 8,
    fontWeight: '500',
  },
  predefinedAvatarsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  avatarGridContainer: {
    padding: 12,
  },
  avatarOption: {
    width: '25%',
    aspectRatio: 1,
    padding: 8,
    position: 'relative',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  selectedAvatarOption: {
    borderWidth: 0,
  },
  selectedAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(83, 109, 254, 0.5)',
    borderRadius: 35,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInputWrapper: {
    marginBottom: 24,
    backgroundColor: '#F1F3FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nameInput: {
    fontSize: 16,
    color: '#212121',
    padding: 12,
    width: '100%',
  },
  lockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(83, 109, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    color: '#212121',
    marginLeft: 12,
  },
});

export default ProfileScreen;
