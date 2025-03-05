import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  BackHandler,
  AppState,
  Modal, // Add this import
  Dimensions // Add this import
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNotes } from '../context/NotesContext';
import NoteCard from '../components/NoteCard';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import NoteContextMenu from '../components/NoteContextMenu'; // Add imports for the context menu
import { useTheme } from '../context/ThemeContext'; // Add this import
import { useAlert } from '../context/AlertContext'; // Add this import

const { width } = Dimensions.get('window'); // Add this line

const FavoritesScreen = ({ navigation }) => {
  const { theme } = useTheme(); // Get current theme for dark mode support
  const { notes, loading, refreshNotes, removeNote, editNote, bulkEditNotes, bulkRemoveNotes } = useNotes();
  const alert = useAlert(); // Add this line
  const [localLoading, setLocalLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  
  // Add sortBy state and modal state
  const [sortBy, setSortBy] = useState('date');
  const [showSortModal, setShowSortModal] = useState(false);
  
  // Create animations - all refs must be created at top level
  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;
  const selectionModeAnim = useRef(new Animated.Value(0)).current;
  const sortButtonAnim = useRef(new Animated.Value(0)).current; // Add sort button animation
  
  // Add these state variables for the context menu
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedNoteForMenu, setSelectedNoteForMenu] = useState(null);
  
  // Filter only favorite notes
  const favoriteNotes = React.useMemo(() => {
    // First filter to get only favorite notes
    const favNotes = notes.filter(note => note.favorite);
    
    // Then apply sorting based on sortBy value, with pinned notes always on top
    let sortedNotes = [...favNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1; // Pinned notes go to the top
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    // Apply additional sorting based on sortBy value
    switch (sortBy) {
      case 'title':
        sortedNotes = [...sortedNotes].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'priority':
        const priorityValue = { high: 3, medium: 2, low: 1, undefined: 0 };
        sortedNotes = [...sortedNotes].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return priorityValue[b.priority || 'undefined'] - priorityValue[a.priority || 'undefined'];
        });
        break;
      default: // date (default)
        // Already handled above
        break;
    }
    return sortedNotes;
  }, [notes, sortBy]);

  // Refresh notes when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Reset selection mode when screen receives focus
      setSelectionMode(false);
      setSelectedNotes([]);
      setLocalLoading(true);
      refreshNotes().finally(() => {
        setTimeout(() => setLocalLoading(false), 300);
      });
      
      return () => {
        headerAnim.setValue(0);
        listAnim.setValue(0);
        sortButtonAnim.setValue(0); // Reset sort button animation
        selectionModeAnim.setValue(0);
      };
    }, [refreshNotes])
  );

  // Animate components after loading
  useEffect(() => {
    if (!localLoading && !loading) {
      // Delayed animation
      const animationTimeout = setTimeout(() => {
        Animated.stagger(200, [
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(sortButtonAnim, { // Add sort button animation
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(listAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);
      return () => clearTimeout(animationTimeout);
    }
  }, [localLoading, loading, headerAnim, listAnim, sortButtonAnim]);

  // Selection mode animation
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
  }, [selectionMode, selectionModeAnim]);

  // Add this effect to exit selection mode when screen loses focus
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LottieView
        source={require('../../assets/empty-favorites.json')}
        style={styles.lottie}
        autoPlay
        loop
      />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No favorite notes yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
        Star your important notes to access them quickly from here
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.8}
      >
        <Text style={styles.browseButtonText}>Browse all notes</Text>
      </TouchableOpacity>
    </View>
  );

  // Improve the loading state UI
  if (loading || localLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <LottieView
            source={require('../../assets/loading.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
            speed={1.2} // Slightly faster animation
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Add long press selection mode functionality to FavoritesScreen
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
      const newSelectedNotes = selectedNotes.filter(id => id !== noteId);
      setSelectedNotes(newSelectedNotes);
      if (newSelectedNotes.length === 0) {
        setSelectionMode(false); // Exit selection mode if unselecting the last item
      }
    } else {
      setSelectedNotes([...selectedNotes, noteId]);
    }
  };

  const selectAllNotes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedNotes.length === favoriteNotes.length) {
      // If all notes are already selected, unselect all
      setSelectedNotes([]);
      setSelectionMode(false);
    } else {
      // Select all notes
      setSelectedNotes(favoriteNotes.map(note => note.id));
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

  // Add handleSortByChange function
  const handleSortByChange = (value) => {
    setSortBy(value);
    setShowSortModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add Sort Modal Component
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
        <View style={[styles.sortModalContainer, { backgroundColor: theme.background }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.sortModalTitle, { color: theme.text }]}>Sort Favorites By</Text>
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => handleSortByChange('date')}
          >
            <MaterialIcons 
              name="access-time" 
              size={20} 
              color={sortBy === 'date' ? theme.accent : theme.secondaryText} 
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
            style={styles.sortOption}
            onPress={() => handleSortByChange('title')}
          >
            <MaterialIcons 
              name="sort-by-alpha" 
              size={20} 
              color={sortBy === 'title' ? theme.accent : theme.secondaryText} 
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
            style={styles.sortOption}
            onPress={() => handleSortByChange('priority')}
          >
            <MaterialIcons 
              name="flag" 
              size={20} 
              color={sortBy === 'priority' ? theme.accent : theme.secondaryText} 
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

  // Add handleSelectFromContextMenu method
  const handleSelectFromContextMenu = (noteId) => {
    toggleSelectionMode(noteId);
  };

  // Fix the onLongPress prop in the FlatList renderItem
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
      <StatusBar style={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      
      {/* Header with improved animation */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }
            ],
            backgroundColor: theme.background, // Add background color based on theme
            borderBottomColor: theme.border, // Add border color based on theme
          }
        ]}
      >
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Favorites</Text>
          <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.countText}>{favoriteNotes.length}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {/* Add sort button */}
          <Animated.View
            style={{
              opacity: sortButtonAnim,
              transform: [{ scale: sortButtonAnim }]
            }}
          >
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.buttonBackground }]}
              onPress={() => setShowSortModal(true)}
            >
              <MaterialIcons name="sort" size={24} color={theme.icon} />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.buttonBackground }]}
            onPress={() => {
              try {
                // Explicitly pass searchInFavorites as true to Search screen
                navigation.navigate('Search', { 
                  searchInFavorites: true,
                  initialSource: 'favorites'  // Add an additional parameter to identify the source
                });
              } catch (error) {
                console.error("Navigation to Search screen failed:", error);
                Alert.alert("Search Unavailable", "The search feature is not available right now.");
              }
            }}
          >
            <MaterialIcons name="search" size={24} color={theme.icon} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content with improved animation */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: listAnim,
            transform: [
              { 
                translateY: listAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0], // Reduced movement
                })
              }
            ],
          },
        ]}
      >
        <FlatList
          data={favoriteNotes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.notesList,
            favoriteNotes.length === 0 && styles.emptyList,
            selectionMode && styles.notesListWithSelection // Add extra padding when in selection mode
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          // Add performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      </Animated.View>

      {/* Add Sort Modal */}
      <SortModal />

      {/* Add SelectionModeBar component at the bottom of the screen */}
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
                  })
                },
              ],
              opacity: selectionModeAnim,
              backgroundColor: theme.accent, // Add background color based on theme
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
                name={selectedNotes.length === favoriteNotes.length ? "deselect" : "select-all"} 
                size={22} 
                color="#fff" 
              />
              <Text style={styles.selectionButtonText}>
                {selectedNotes.length === favoriteNotes.length ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.selectionButton} 
              onPress={() => handleBulkFavorite(false)}
            >
              <MaterialIcons name="star-border" size={22} color="#fff" />
              <Text style={styles.selectionButtonText}>Unfavorite</Text>
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

      {/* Context Menu */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Remove hardcoded white; use inline style override
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  notesList: {
    padding: 16,
    paddingBottom: 100,
  },
  notesListWithSelection: {
    paddingBottom: 180, // Extra padding when selection mode is active
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // Removed hardcoded color here as we're applying it with theme.text
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    // Removed hardcoded color here as we're applying it with theme.secondaryText
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#536DFE',
    borderRadius: 24,
    shadowColor: '#536DFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: '#536DFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 16,
    textAlign: 'center',
  },
  loadingAnimation: {
    width: 120,
    height: 120,
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
  // Add modal overlay styles
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
});

export default FavoritesScreen;
