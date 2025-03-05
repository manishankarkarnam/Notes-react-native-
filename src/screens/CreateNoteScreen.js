import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
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

const PRIORITY_OPTIONS = [
  { label: 'High', value: 'high', color: '#FF5252' },
  { label: 'Medium', value: 'medium', color: '#FFD740' },
  { label: 'Low', value: 'low', color: '#69F0AE' },
];

const CreateNoteScreen = ({ navigation }) => {
  const { theme } = useTheme(); // Get current theme
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [color, setColor] = useState('#FFFFFF');
  const [priority, setPriority] = useState('low');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false); // Add favorite state
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const saveButtonScale = useRef(new Animated.Value(0)).current;
  
  // Focus ref for title input
  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);
  
  const { addNote } = useNotes();
  const alert = useAlert(); // Add this line
  
  useEffect(() => {
    // Animate components when screen mounts
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
      Animated.spring(saveButtonScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Focus title input after animation
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 600);
    
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  const handlePriorityChange = () => {
    // Cycle through priorities: low -> medium -> high -> low
    const nextPriority = priority === 'low' ? 'medium' : priority === 'medium' ? 'high' : 'low';
    setPriority(nextPriority);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const getPriorityColor = () => {
    switch(priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FFD740';
      case 'low': return '#69F0AE';
      default: return '#E0E0E0';
    }
  };

  const togglePinned = () => {
    setIsPinned(!isPinned);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      titleInputRef.current?.focus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);
      
      // Animate button press
      Animated.sequence([
        Animated.timing(saveButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(saveButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Prepare note data
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        color,
        priority,
        tags: tags.length > 0 ? tags : [],
        pinned: isPinned,
        favorite: isFavorite, // Add the favorite property
      };
      
      // Save the note using the context
      await addNote(noteData);
      
      // Navigate back to the home screen
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      alert.showErrorAlert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Check if there's content to confirm cancellation
    if (title.trim() || content.trim() || tags.length > 0) {
      alert.showConfirmationAlert(
        'Discard Changes',
        'Are you sure you want to discard this note?',
        () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.goBack();
        }
      );
    } else {
      navigation.goBack();
    }
  };

  // Color Palette Component
  const ColorPalette = ({ colors, selectedColor, onSelect }) => {
    return (
      <View style={styles.colorPaletteContainer}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColorOption
            ]}
            onPress={() => {
              onSelect(color);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            {selectedColor === color && (
              <MaterialIcons name="check" size={18} color={color === '#FFFFFF' ? '#000' : '#FFF'} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Add a handler for tags changes
  const handleTagsChange = (newTags) => {
    setTags(newTags);
    // Optional: Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidingView}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity, backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
          >
            <MaterialIcons name="close" size={24} color={theme.icon} />
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
                name="star" 
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
          </View>
        </Animated.View>
        
        {/* Content */}
        <Animated.ScrollView 
          style={[styles.content, { opacity: contentOpacity }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <TextInput
            ref={titleInputRef}
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Title"
            placeholderTextColor={theme.secondaryText}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={100}
          />
          
          {/* Priority indicator */}
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
          
          {/* New Tags section using the TagsInput component */}
          <View style={styles.tagsWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
            <TagsInput 
              value={tags}
              onChange={handleTagsChange}
              placeholder="Add tags..."
              maxTags={10}
              containerStyle={styles.tagsInputContainer}
            />
          </View>
          
          {/* Note Content */}
          <TextInput
            ref={contentInputRef}
            style={[styles.contentInput, { color: theme.text }]}
            placeholder="Start typing..."
            placeholderTextColor={theme.secondaryText}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </Animated.ScrollView>
        
        {/* Save Button */}
        <Animated.View 
          style={[
            styles.saveButtonContainer,
            { transform: [{ scale: saveButtonScale }] }
          ]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
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
              <MaterialIcons name="check" size={28} color="#FFF" />
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
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    padding: 0,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  tagsWrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#424242',
  },
  tagsInputContainer: {
    backgroundColor: 'transparent',
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
    height: 200,
    textAlignVertical: 'top',
    padding: 0,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  saveButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#536DFE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#536DFE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Color Palette styles
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
  buttonLoadingAnimation: {
    width: 28,
    height: 28,
  },
});

export default CreateNoteScreen;
