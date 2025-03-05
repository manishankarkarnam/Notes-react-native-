import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Share,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useNotes } from '../context/NotesContext';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';
import TagsInput from '../components/TagsInput';
import { useAlert } from '../context/AlertContext'; // Add this import

// Default note colors
const NOTE_COLORS = [
  '#FFFFFF', // White
  '#FFECB3', // Light Yellow
  '#FFCDD2', // Light Red
  '#C5E1A5', // Light Green
  '#B3E5FC', // Light Blue
  '#E1BEE7', // Light Purple
  '#F5F5F5', // Light Gray
  '#D7CCC8', // Light Brown
];

const PRIORITY_LABELS = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
};

const NoteDetailScreen = ({ route, navigation }) => {
  const { theme } = useTheme(); // Get current theme
  const { noteId } = route.params;
  const { notes, editNote, removeNote } = useNotes();
  const alert = useAlert(); // Add this line
  
  // Find the note from context
  const noteData = notes.find(note => note.id === noteId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#FFFFFF');
  const [tags, setTags] = useState([]);
  const [priority, setPriority] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false); // Add new state for favorite status
  const [textZoom, setTextZoom] = useState(1); // 1 is default size
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  
  // Input refs
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  
  // Initialize note data when component mounts
  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || '');
      setContent(noteData.content || '');
      setColor(noteData.color || '#FFFFFF');
      setTags(noteData.tags || []);
      setPriority(noteData.priority || 'low');
      setIsPinned(noteData.pinned || false);
      setIsFavorite(noteData.favorite || false); // Initialize favorite state
      setIsLoading(false);
      
      // Start animations
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.spring(fabScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Note not found, navigate back
      alert.showErrorAlert('Error', 'Note not found.');
      navigation.goBack();
    }
  }, [noteData]);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      handleSave();
    } else {
      // Enable editing mode
      setIsEditing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Focus the title input
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  };
  
  const handleSave = async () => {
    if (!title.trim()) {
      alert.showWarningAlert('Error', 'Title cannot be empty.');
      return;
    }
    
    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Update note using context
      await editNote(noteId, {
        title: title.trim(),
        content: content.trim(),
        color,
        tags,
        priority,
        pinned: isPinned,
        favorite: isFavorite, // Include favorite status when saving
      });
      
      setIsEditing(false);
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert.showErrorAlert('Error', 'Failed to save changes.');
      setIsSaving(false);
    }
  };
  
  const handleDelete = () => {
    alert.showDestructiveAlert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      async () => {
        try {
          // Allow the Alert to close first
          await new Promise(resolve => setTimeout(resolve, 100));
          const idToDelete = noteId;
          // Navigate back first
          navigation.goBack();
          // Delete the note after a delay to ensure navigation completes
          setTimeout(() => {
            removeNote(idToDelete);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 500);
        } catch (error) {
          console.error('Error deleting note:', error);
        }
      }
    );
  };
  
  const togglePinned = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPinned(!isPinned);
    // If not in edit mode, update directly
    if (!isEditing) {
      editNote(noteId, { pinned: !isPinned });
    }
  };
  
  const handlePriorityChange = () => {
    // Cycle through priorities: low -> medium -> high -> low
    const nextPriority = priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : 'low';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriority(nextPriority);
    // If not in edit mode, update directly
    if (!isEditing) {
      editNote(noteId, { priority: nextPriority });
    }
  };
  
  const getPriorityColor = () => {
    switch(priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FFD740';
      case 'low': return '#69F0AE';
      default: return '#E0E0E0';
    }
  };
  
  const handleShareNote = async () => {
    try {
      const result = await Share.share({
        title: title,
        message: `${title}\n\n${content}${tags.length ? `\n\nTags: ${tags.join(', ')}` : ''}`,
      });
    } catch (error) {
      alert.showErrorAlert('Error', 'Failed to share note.');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };
  
  // Add a toggleFavorite function
  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFavorite(!isFavorite);
    // If not in edit mode, update directly
    if (!isEditing) {
      editNote(noteId, { favorite: !isFavorite });
    }
  };

  // Add zoom control functions
  const increaseTextSize = () => {
    if (textZoom < 1.5) { // Limit max zoom
      setTextZoom(prev => Math.min(prev + 0.1, 1.5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const decreaseTextSize = () => {
    if (textZoom > 0.8) { // Limit min zoom
      setTextZoom(prev => Math.max(prev - 0.1, 0.8));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const resetTextSize = () => {
    if (textZoom !== 1) {
      setTextZoom(1); // Reset to default
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Handler for tag changes
  const handleTagsChange = (newTags) => {
    setTags(newTags);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Add zoom control components - completely redesigned
  const TextZoomControls = () => {
    // Only show in view mode, not in editing mode
    if (isEditing) return null;
    
    // Add a scale animation ref for button press feedback
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const animatePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };
    
    const handleZoomIn = () => {
      if (textZoom < 1.5) {
        increaseTextSize();
        animatePress();
      }
    };
    
    const handleZoomOut = () => {
      if (textZoom > 0.8) {
        decreaseTextSize();
        animatePress();
      }
    };
    
    return (
      <Animated.View 
        style={[
          styles.zoomControlsContainer, 
          { 
            backgroundColor: theme.dark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.85)',
            borderColor: theme.dark ? 'rgba(70,70,70,0.9)' : 'rgba(0,0,0,0.08)',
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.zoomButton,
            { backgroundColor: theme.dark ? 'rgba(50,50,50,0.8)' : 'rgba(240,240,240,0.8)' }
          ]}
          onPress={handleZoomOut}
          disabled={textZoom <= 0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
        >
          <MaterialIcons 
            name="remove" 
            size={14} 
            color={textZoom <= 0.8 
              ? theme.dark ? '#666' : '#BDBDBD' 
              : theme.dark ? '#f0f0f0' : '#536DFE'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            resetTextSize();
            animatePress();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <Text style={[
            styles.zoomText, 
            { 
              color: theme.dark ? '#f0f0f0' : '#536DFE',
              fontWeight: textZoom !== 1 ? '600' : 'normal'
            }
          ]}>
            {Math.round(textZoom * 100)}%
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.zoomButton,
            { backgroundColor: theme.dark ? 'rgba(50,50,50,0.8)' : 'rgba(240,240,240,0.8)' }
          ]}
          onPress={handleZoomIn}
          disabled={textZoom >= 1.5}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
        >
          <MaterialIcons 
            name="add" 
            size={14} 
            color={textZoom >= 1.5 
              ? theme.dark ? '#666' : '#BDBDBD' 
              : theme.dark ? '#f0f0f0' : '#536DFE'} 
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <LottieView
          source={require('../../assets/loading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigation.goBack}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[
                styles.headerButton,
                isFavorite && styles.activeFavoriteButton
              ]} 
              onPress={toggleFavorite}
            >
              <MaterialIcons 
                name={isFavorite ? "star" : "star-outline"} 
                size={24} 
                color={isFavorite ? "#FFC107" : theme.icon} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.headerButton,
                isPinned && styles.activePinButton
              ]} 
              onPress={togglePinned}
            >
              <MaterialIcons 
                name="push-pin" 
                size={24} 
                color={isPinned ? "#2196F3" : theme.icon} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.headerButton,
                { backgroundColor: `${getPriorityColor()}20` }
              ]}
              onPress={handlePriorityChange}
            >
              <MaterialIcons 
                name="flag" 
                size={24} 
                color={getPriorityColor()} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleShareNote}
            >
              <MaterialIcons name="share" size={24} color={theme.icon} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color={theme.icon} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Note Content */}
        <Animated.ScrollView 
          style={[styles.content, { opacity: contentOpacity }]} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="always" // Changed to "always"
          keyboardDismissMode="none" // Add this to prevent keyboard from dismissing on scroll
        >
          {/* Title */}
          {isEditing ? (
            <TextInput
              ref={titleInputRef}
              style={[styles.titleInput, { color: theme.text }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={theme.secondaryText}
              multiline
              maxLength={100}
            />
          ) : (
            <Text style={[styles.title, { fontSize: 28 * textZoom, color: theme.text }]}>{title}</Text>
          )}

          {/* Creation/Update date */}
          {!isEditing && noteData && (
            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, { color: theme.secondaryText }]}>
                {noteData.updatedAt !== noteData.createdAt ? 'Updated ' : 'Created '}
                {formatDate(noteData.updatedAt || noteData.createdAt)}
              </Text>
            </View>
          )}

          {/* Priority badge */}
          <View style={styles.priorityContainer}>
            <View style={[
              styles.priorityBadge, 
              { backgroundColor: getPriorityColor() }
            ]}>
              <Text style={styles.priorityText}>
                {PRIORITY_LABELS[priority]}
              </Text>
            </View>
          </View>

          {/* Tags section using our reusable TagsInput component */}
          <View style={styles.tagsWrapper}>
            {/* Only show tags when not editing */}
            {!isEditing && tags.length > 0 && (
              <View style={styles.tagsDisplayContainer}>
                {tags.map((tag, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.tagBadge,
                      { backgroundColor: theme.background, borderColor: theme.border }
                    ]}
                  >
                    <Text style={[styles.tagBadgeText, { color: theme.secondaryText }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Show editable TagsInput only when in edit mode */}
            {isEditing && (
              <TagsInput 
                value={tags}
                onChange={handleTagsChange}
                placeholder="Add tags..."
                maxTags={10}
                containerStyle={styles.tagsInputContainer}
              />
            )}
          </View>

          {/* Main content - apply zoom to text size */}
          {isEditing ? (
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { color: theme.text }]}
              value={content}
              onChangeText={setContent}
              placeholder="Start typing..."
              placeholderTextColor={theme.secondaryText}
              multiline
              textAlignVertical="top"
            />
          ) : (
            <Text style={[ 
              styles.contentText, 
              { 
                fontSize: Math.round(17 * textZoom), 
                lineHeight: Math.round(26 * textZoom),
                color: theme.text
              }
            ]}>
              {content}
            </Text>
          )}

          {/* Extra space at bottom */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>

        {/* Reposition the TextZoomControls to the bottom right above the edit FAB */}
        <Animated.View style={[styles.zoomControlsWrapper, { opacity: contentOpacity }]}>
          <TextZoomControls />
        </Animated.View>

        {/* Edit/Save button */}
        <Animated.View 
          style={[
            styles.fabContainer,
            { transform: [{ scale: fabScale }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.fab, 
              isEditing ? styles.saveFab : styles.editFab
            ]}
            onPress={handleEditToggle}
            disabled={isSaving}
          >
            {isSaving ? (
              <LottieView
                source={require('../../assets/loading.json')}
                autoPlay
                loop
                style={styles.buttonLoadingAnimation}
              />
            ) : (
              <MaterialIcons 
                name={isEditing ? "check" : "edit"} 
                size={24} 
                color="#FFF" 
              />
            )}
          </TouchableOpacity>
        </Animated.View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  activePinButton: {
    backgroundColor: 'rgba(33,150,243,0.1)',
  },
  activeFavoriteButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  content: {
    flex: 1,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
    padding: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
  },
  dateContainer: {
    marginBottom: 18,
  },
  dateText: {
    fontSize: 14,
    color: '#757575',
  },
  priorityContainer: {
    marginBottom: 18,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  priorityText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tagsWrapper: {
    marginBottom: 16,
  },
  tagsDisplayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontSize: 14,
  },
  tagsInputContainer: {
    backgroundColor: 'transparent',
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 26,
    color: '#212121',
    minHeight: 200,
    textAlignVertical: 'top',
    padding: 0,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  contentText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#212121',
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#536DFE',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 10,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editFab: {
    backgroundColor: '#536DFE',
  },
  saveFab: {
    backgroundColor: '#4CAF50',
  },
  contentText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#212121',
  },
  // Updated zoom control styles
  zoomControlsWrapper: {
    position: 'absolute',
    bottom: 100, // Position above the FAB button
    right: 30,   // Align with the FAB button
    zIndex: 5,
  },
  zoomControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  zoomButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 12,
    paddingHorizontal: 6,
    minWidth: 36,
    textAlign: 'center',
  },
});

export default NoteDetailScreen;