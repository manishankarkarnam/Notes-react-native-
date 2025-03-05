import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  TextInput,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  BackHandler,
  AppState,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import NoteCard from '../components/NoteCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NoteContextMenu from '../components/NoteContextMenu';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext'; // Add this import

const { width } = Dimensions.get('window');

// User profile storage key (must match the one in ProfileScreen)
const USER_PROFILE_KEY = 'user_profile_data';

// Import or recreate the avatar options array
const avatarOptions = [
  { id: 1, source: require('../../assets/inbuilt_avatars/1.jpg') },
  { id: 2, source: require('../../assets/inbuilt_avatars/2.jpg') },
  { id: 3, source: require('../../assets/inbuilt_avatars/3.jpg') },
  { id: 4, source: require('../../assets/inbuilt_avatars/4.jpg') },
  { id: 5, source: require('../../assets/inbuilt_avatars/5.jpg') },
  { id: 6, source: require('../../assets/inbuilt_avatars/6.jpg') },
  { id: 7, source: require('../../assets/inbuilt_avatars/7.jpg') },
  { id: 8, source: require('../../assets/inbuilt_avatars/8.jpg') },
  { id: 9, source: require('../../assets/inbuilt_avatars/9.jpg') },
  { id: 10, source: require('../../assets/inbuilt_avatars/0.jpg') },
];

// Default avatar ID (not URL)
const DEFAULT_AVATAR_ID = 1;

const HomeScreen = ({ navigation, route }) => {
  const { theme } = useTheme(); // Get current theme for dark mode support
  const { notes, loading, refreshNotes, removeNote, editNote, bulkEditNotes, bulkRemoveNotes } = useNotes();
  const alert = useAlert(); // Add this line
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [showSortModal, setShowSortModal] = useState(false);
  
  // Change userAvatar to store ID instead of URL
  const [userAvatarId, setUserAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  
  const fabAnim = useRef(new Animated.Value(0)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const sortButtonAnim = useRef(new Animated.Value(0)).current;
  
  // Add long press selection mode functionality
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const selectionModeAnim = useRef(new Animated.Value(0)).current;

  // Add state variables for context menu
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedNoteForMenu, setSelectedNoteForMenu] = useState(null);

  // Helper function to get avatar source from ID
  const getAvatarSource = (avatarId) => {
    // If it's a string and looks like a URI, it's a custom avatar
    if (typeof avatarId === 'string' && (avatarId.startsWith('file:') || avatarId.startsWith('content:'))) {
      return { uri: avatarId };
    }
    
    // Otherwise it's one of our predefined avatars with numeric ID
    const avatar = avatarOptions.find(a => a.id === avatarId);
    return avatar ? avatar.source : avatarOptions[0].source; // Default to first avatar if not found
  };

  // Load user profile data
  const loadUserProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (storedProfile) {
        const userData = JSON.parse(storedProfile);
        // Handle both numeric IDs and URI strings for avatar
        if (userData.avatar !== undefined) {
          setUserAvatarId(userData.avatar);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Refresh notes and user data when the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset selection mode when screen gets focus
      setSelectionMode(false);
      setSelectedNotes([]);
      // Refresh notes
      refreshNotes();
      // Load user profile for avatar
      loadUserProfile();
      
      return () => {
        // Optional cleanup if needed
      };
    }, [refreshNotes])
  );
  
  // Avatar Modal Component
  const AvatarModal = () => (
    <Modal
      visible={avatarModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setAvatarModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setAvatarModalVisible(false)}
      >
        <View style={styles.avatarModalContent}>
          <Image 
            source={getAvatarSource(userAvatarId)}
            style={styles.enlargedAvatar}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.closeAvatarButton}
            onPress={() => setAvatarModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewProfileButton, { backgroundColor: theme.accent }]}
            onPress={() => {
              setAvatarModalVisible(false);
              navigation.navigate('Profile');
            }}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Refresh notes when the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset selection mode when screen gets focus
      setSelectionMode(false);
      setSelectedNotes([]);
      // Refresh notes
      refreshNotes();
      
      return () => {
        // Optional cleanup if needed
      };
    }, [refreshNotes])
  );
  
  useLayoutEffect(() => {
    if (route.params?.newNote) {
      Animated.spring(fabAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
      navigation.setParams({ newNote: undefined });
    }
  }, [route.params?.newNote]);

  // Initialize animations
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
      animateEntrance();
    }, 1000);
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(fabAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(sortButtonAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddNote = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(fabAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('CreateNote');
    });
  };

  const handleNotePress = (note) => {
    navigation.navigate('NoteDetail', { noteId: note.id });
  };

  const handleDeleteNote = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeNote(id);
  };

  const handlePinNote = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const noteToUpdate = notes.find(note => note.id === id);
    if (noteToUpdate) {
      editNote(id, { pinned: !noteToUpdate.pinned });
    }
  };

  const handleFavoriteNote = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const noteToUpdate = notes.find(note => note.id === id);
    if (noteToUpdate) {
      editNote(id, { favorite: !noteToUpdate.favorite });
    }
  };

  const handleSortByChange = (value) => {
    setSortBy(value);
    setShowSortModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const getFilteredNotes = () => {
    let filteredNotes = notes;
    // Filter by search query
    if (searchQuery) {
      filteredNotes = filteredNotes.filter(
        note => 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    // Sort pinned notes first by default
    filteredNotes = [...filteredNotes].sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return a.pinned ? -1 : 1;
    });
    // Apply sorting based on sortBy value
    switch (sortBy) {
      case 'title':
        filteredNotes = [...filteredNotes].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'priority':
        const priorityValue = { high: 3, medium: 2, low: 1, undefined: 0 };
        filteredNotes = [...filteredNotes].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return priorityValue[b.priority] - priorityValue[a.priority];
        });
        break;
      default: // date (default)
        // Already handled in the main sorting logic
        break;
    }
    return filteredNotes;
  };

  const renderEmptyState = () => {
    let title = 'No notes yet!';
    let subtitle = 'Create your first note to get started';
    let showCreateButton = !searchQuery;
    let animationSource = require('../../assets/empty-notes.json');
    
    if (searchQuery) {
      title = 'No results found';
      subtitle = 'Try a different search term';
      animationSource = require('../../assets/no-results.json');
    }
    
    return (
      <View style={styles.emptyContainer}>
        <LottieView 
          source={animationSource}
          style={styles.lottie}
          autoPlay
          loop
        />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
        {showCreateButton && (
          <TouchableOpacity 
            style={styles.createNoteButton}
            onPress={handleAddNote}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A67FF', '#536DFE']}
              style={styles.createNoteButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons 
                name="add" 
                size={18} 
                color="#fff" 
                style={styles.createNoteButtonIcon} 
              />
              <Text style={styles.createNoteButtonText}>Create Note</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const shouldShowFAB = () => {
    return notes.length > 0;
  };

  // Sort Modal Component
  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={[styles.sortModalContainer, { backgroundColor: theme.card }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.sortModalTitle, { color: theme.text }]}>Sort By</Text>
          <TouchableOpacity
            style={[styles.sortOption, { borderBottomColor: theme.border }]}
            onPress={() => handleSortByChange('date')}
          >
            <MaterialIcons 
              name="access-time" 
              size={20} 
              color={sortBy === 'date' ? theme.accent : theme.icon} 
            />
            <Text style={[
              styles.sortOptionText,
              sortBy === 'date' && styles.selectedSortOptionText,
              { color: sortBy === 'date' ? theme.accent : theme.text }
            ]}>
              Date
            </Text>
            {sortBy === 'date' && <MaterialIcons name="check" size={20} color={theme.accent} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, { borderBottomColor: theme.border }]}
            onPress={() => handleSortByChange('title')}
          >
            <MaterialIcons 
              name="sort-by-alpha" 
              size={20} 
              color={sortBy === 'title' ? theme.accent : theme.icon} 
            />
            <Text style={[
              styles.sortOptionText,
              sortBy === 'title' && styles.selectedSortOptionText,
              { color: sortBy === 'title' ? theme.accent : theme.text }
            ]}>
              Title
            </Text>
            {sortBy === 'title' && <MaterialIcons name="check" size={20} color={theme.accent} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, { borderBottomColor: theme.border }]}
            onPress={() => handleSortByChange('priority')}
          >
            <MaterialIcons 
              name="flag" 
              size={20} 
              color={sortBy === 'priority' ? theme.accent : theme.icon} 
            />
            <Text style={[
              styles.sortOptionText,
              sortBy === 'priority' && styles.selectedSortOptionText,
              { color: sortBy === 'priority' ? theme.accent : theme.text }
            ]}>
              Priority
            </Text>
            {sortBy === 'priority' && <MaterialIcons name="check" size={20} color={theme.accent} />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Add useEffect for selection mode animation
  useEffect(() => {
    Animated.timing(selectionModeAnim, {
      toValue: selectionMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Clear selected notes when exiting selection mode
    if (!selectionMode) {
      setSelectedNotes([]);
    }
  }, [selectionMode]);

  // Add functions to handle selection
  const toggleSelectionMode = (noteId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedNotes([noteId]);
    }
  };

  const toggleNoteSelection = (noteId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedNotes.includes(noteId)) {
      setSelectedNotes(selectedNotes.filter(id => id !== noteId));
      if (selectedNotes.length === 1) {
        setSelectionMode(false); // Exit selection mode if unselecting the last item
      }
    } else {
      setSelectedNotes([...selectedNotes, noteId]);
    }
  };

  const selectAllNotes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedNotes.length === getFilteredNotes().length) {
      // If all notes are already selected, unselect all
      setSelectedNotes([]);
      setSelectionMode(false);
    } else {
      // Select all notes
      setSelectedNotes(getFilteredNotes().map(note => note.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotes.length === 0) return;
    alert.showDestructiveAlert(
      'Delete Notes',
      `Are you sure you want to delete ${selectedNotes.length} note${selectedNotes.length > 1 ? 's' : ''}?`,
      () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Use the bulkRemoveNotes method from context
        bulkRemoveNotes(selectedNotes)
          .then(() => {
            setSelectionMode(false);
          })
          .catch(error => {
            console.error('Failed to delete notes:', error);
            alert.showErrorAlert('Error', 'Failed to delete some notes. Please try again.');
          });
      }
    );
  };

  const handleBulkFavorite = (value = true) => {
    if (selectedNotes.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Use the bulkEditNotes method from context
    bulkEditNotes(selectedNotes, { favorite: value })
      .then(() => {
        // Remove the Alert and simply exit selection mode
        setSelectionMode(false);
      })
      .catch(error => {
        console.error('Failed to update favorites:', error);
        alert.showErrorAlert('Error', 'Failed to update some notes. Please try again.');
      });
  };

  const handleBulkPin = (value = true) => {
    if (selectedNotes.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Use the bulkEditNotes method from context
    bulkEditNotes(selectedNotes, { pinned: value })
      .then(() => {
        // Remove the Alert and simply exit selection mode
        setSelectionMode(false);
      })
      .catch(error => {
        console.error('Failed to update pins:', error);
        alert.showErrorAlert('Error', 'Failed to update some notes. Please try again.');
      });
  };

  // Add logic to exit selection mode when navigating away
  useEffect(() => {
    // This handles when the component is unmounted or user navigates away
    const unsubscribe = navigation.addListener('blur', () => {
      if (selectionMode) {
        setSelectionMode(false);
        setSelectedNotes([]);
      }
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [navigation, selectionMode]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectionMode) {
        setSelectionMode(false);
        setSelectedNotes([]);
        return true; // Prevent default action
      }
      return false; // Let default action happen
    });
    return () => backHandler.remove();
  }, [selectionMode]);

  // Add an additional useEffect for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/) && selectionMode) {
        setSelectionMode(false);
        setSelectedNotes([]);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [selectionMode]);

  const handleNoteLongPress = (note, event) => {
    // Don't show context menu if already in selection mode
    if (selectionMode) {
      toggleNoteSelection(note.id);
      return;
    }
    // Apply haptic feedback on long press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Get the screen coordinates from the touch event
    const { pageX, pageY } = event.nativeEvent;
    
    // Set the position and note for the context menu
    setContextMenuPosition({ x: pageX, y: pageY });
    setSelectedNoteForMenu(note);
    setContextMenuVisible(true);
  };

  // Fix the handleSelectFromContextMenu method definition
  const handleSelectFromContextMenu = (noteId) => {
    toggleSelectionMode(noteId);
  };

  // Add missing onLongPress method for renderItem
  const renderItem = ({ item }) => (
    <NoteCard
      note={item}
      onPress={() => selectionMode ? toggleNoteSelection(item.id) : handleNotePress(item)}
      onDelete={() => handleDeleteNote(item.id)}
      onPin={() => handlePinNote(item.id)}
      onFavorite={() => handleFavoriteNote(item.id)}
      onLongPress={(nativeEvent) => handleNoteLongPress(item, { nativeEvent })}
      selected={selectedNotes.includes(item.id)}
      selectionMode={selectionMode}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} translucent={true} /> 
      <Animated.View 
        style={[
          styles.header, 
          { 
            opacity: headerAnim, 
            transform: [{ translateY: headerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0]
            })}],
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          }
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>My Notes</Text>
        <View style={styles.headerButtons}>
          <Animated.View 
            style={{
              opacity: sortButtonAnim, 
              transform: [{ scale: sortButtonAnim }],
              marginRight: 10
            }}
          >
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: theme.buttonBackground }]}
              onPress={() => setShowSortModal(true)}
            >
              <MaterialIcons name="sort" size={24} color={theme.icon} />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => setAvatarModalVisible(true)}
          >
            <Image source={getAvatarSource(userAvatarId)} style={styles.avatarImage} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      <Animated.View 
        style={[
          styles.searchContainer, 
          { 
            opacity: searchBarAnim, 
            transform: [{ translateY: searchBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}],
            backgroundColor: theme.background,
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.searchBar, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
          onPress={() => {
            try {
              // Direct navigation attempt with error handling
              navigation.navigate('Search', { searchInFavorites: false });
            } catch (error) {
              console.error("Navigation to Search screen failed:", error);
              // Inform the user that search isn't available
              alert.showErrorAlert("Search Unavailable", "The search feature is not available right now.");
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="search" size={24} color={theme.icon} />
          <Text style={[styles.searchPlaceholder, { color: theme.secondaryText }]}>Search notes...</Text>
        </TouchableOpacity>
      </Animated.View>
      {isLoading || loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <LottieView 
            source={require('../../assets/loading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
        </View>
      ) : (
        <FlatList
          data={getFilteredNotes()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.notesList,
            getFilteredNotes().length === 0 && styles.emptyList,
            selectionMode && styles.notesListWithSelection // Add extra padding when in selection mode
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
      <Animated.View 
        style={[
          styles.fabContainer, 
          {
            transform: [
              { scale: fabAnim },
              { translateY: fabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0]
              })}
            ],
            opacity: shouldShowFAB() ? 1 : 0,
            zIndex: 100,
          }
        ]}
        pointerEvents={shouldShowFAB() ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={handleAddNote} activeOpacity={0.8}>
          <LinearGradient
            colors={['#4A67FF', '#536DFE']}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add" size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <SortModal />
      <AvatarModal />
      {selectionMode && (
        <Animated.View 
          style={[
            styles.selectionBar,
            {
              transform: [
                {
                  translateY: selectionModeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: selectionModeAnim,
              backgroundColor: theme.accent,
            }
          ]}
        >
          <View style={styles.selectionInfo}>
            <TouchableOpacity 
              onPress={() => {
                setSelectionMode(false);
                setSelectedNotes([]); // Clear selected notes when closing the selection panel
              }} 
              style={styles.closeSelectionButton}
            >
              <MaterialIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.selectionCount}>
              {selectedNotes.length} selected
            </Text>
          </View>
          
          <View style={styles.selectionActions}>
            <TouchableOpacity 
              style={styles.selectionButton} 
              onPress={selectAllNotes}
            >
              <MaterialIcons 
                name={selectedNotes.length === getFilteredNotes().length ? "deselect" : "select-all"} 
                size={22} 
                color="#fff" 
              />
              <Text style={styles.selectionButtonText}>
                {selectedNotes.length === getFilteredNotes().length ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selectionButton} 
              onPress={() => handleBulkFavorite(true)}
            >
              <MaterialIcons name="star" size={22} color="#fff" />  
              <Text style={styles.selectionButtonText}>Favorite</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selectionButton} 
              onPress={() => handleBulkPin(true)}
            >
              <MaterialIcons name="push-pin" size={22} color="#fff" />  
              <Text style={styles.selectionButtonText}>Pin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selectionButton} 
              onPress={handleBulkDelete}
            >
              <MaterialIcons name="delete" size={22} color="#fff" />
              <Text style={styles.selectionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      <NoteContextMenu
        visible={contextMenuVisible}
        onClose={() => setContextMenuVisible(false)}
        position={contextMenuPosition}
        note={selectedNoteForMenu}
        onSelect={handleSelectFromContextMenu}
        onPin={handlePinNote}
        onFavorite={handleFavoriteNote}
        onDelete={handleDeleteNote}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  // Update profileButton to avatarButton
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  // Add style for avatar image
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  // Add styles for avatar modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  enlargedAvatar: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  closeAvatarButton: {
    position: 'absolute',
    top: -40,
    right: -10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#9E9E9E',
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  notesListWithSelection: {
    paddingBottom: 180, // Extra padding when selection mode is active
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 98,
    right: 30,
    elevation: 10, 
    zIndex: 10, 
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#536DFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  createNoteButton: {
    marginTop: 20,
    borderRadius: 25,
    shadowColor: '#536DFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  createNoteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createNoteButtonIcon: {
    marginRight: 10,
  },
  createNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContainer: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
    marginLeft: 16,
  },
  selectedSortOptionText: {
    color: '#536DFE',
    fontWeight: '500',
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 80, // Adjust based on TabNavigator height
    left: 0,
    right: 0,
    backgroundColor: '#536DFE',
    padding: 12,
    borderRadius: 20,
    marginHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeSelectionButton: {
    padding: 5,
  },
  selectionCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,    
  },
  // Add this missing style for the View Profile button
  viewProfileButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    backgroundColor: '#536DFE',
  },
  viewProfileText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default HomeScreen;
