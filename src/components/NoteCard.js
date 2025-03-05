import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const { width } = Dimensions.get('window');

const NoteCard = ({ 
  note, 
  onPress, 
  onDelete, 
  onPin, 
  onFavorite, 
  onLongPress, 
  selected = false, 
  selectionMode = false 
}) => {
  const { theme } = useTheme(); // Get current theme
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const selectionAnim = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);
  
  React.useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.9, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.rightActions}>
        <Animated.View 
          style={[
            styles.deleteButtonContainer, 
            { 
              transform: [{ scale }],
              opacity 
            }
          ]}
        >
          <TouchableOpacity 
            onPress={onDelete} 
            style={styles.deleteButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#FF5252';
      case 'medium': return '#FFD740';
      case 'low': return '#69F0AE';
      default: return '#E0E0E0';
    }
  };

  // Format the date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Truncate the content if it's too long
  const truncateContent = (content, maxLength = 80) => {
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    return content;
  };

  // Get appropriate color for the category
  const getCategoryColor = (category) => {
    const categoryColors = {
      Personal: '#FF9500',
      Work: '#007AFF',
      Ideas: '#32D74B',
      Tasks: '#FF3B30',
    };
    return categoryColors[category] || '#777';
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={onPress}
          onLongPress={(event) => onLongPress && onLongPress(event.nativeEvent)}
          delayLongPress={300} // Delay for long press
        >
          <View style={[
            styles.card, 
            { backgroundColor: theme.noteCardBackground },
            note.pinned && styles.pinnedCard,
            selected && [styles.selectedCard, { borderColor: theme.accent }]
          ]}>
            {/* Selection indicator */}
            {selectionMode && (
              <Animated.View 
                style={[
                  styles.selectionIndicator,
                  {
                    transform: [
                      { scale: selectionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      }) }
                    ],
                    opacity: selectionAnim
                  }
                ]}
              >
                <MaterialIcons 
                  name={selected ? "check-circle" : "radio-button-unchecked"} 
                  size={24} 
                  color={selected ? theme.accent : theme.secondaryText} 
                />
              </Animated.View>
            )}
            
            <View style={[styles.header, selectionMode && { paddingLeft: 36 }]}>
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(note.priority) }]} />
              <View style={styles.titleContainer}>
                <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{note.title}</Text>
              </View>
            </View>
            
            <Text numberOfLines={3} style={[styles.content, { color: theme.secondaryText }]}>
              {truncateContent(note.content || '')}
            </Text>
            
            {/* Simplified footer with only one set of icons */}
            <View style={styles.footer}>
              <Text style={[styles.date, { color: theme.secondaryText }]}>
                {formatDate(note.updatedAt)}
              </Text>
              
              <View style={styles.metadataContainer}>
                {/* Updated Tags section */}
                {note.tags && note.tags.length > 0 && (
                  <View style={styles.tagContainer}>
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <Text key={index} 
                        style={[
                          styles.tag, 
                          { 
                            backgroundColor: theme.background,
                            color: theme.secondaryText
                          }
                        ]}>
                        #{tag}
                      </Text>
                    ))}
                    {note.tags.length > 2 && (
                      <Text style={[styles.moreTagsText, { color: theme.secondaryText }]}>
                        +{note.tags.length - 2}
                      </Text>
                    )}
                  </View>
                )}
                
                {/* Icon indicators - keep only these icons */}
                <View style={styles.iconRow}>
                  {note.pinned && (
                    <TouchableOpacity 
                      style={styles.iconContainer}
                      // onPress={() => onPin && onPin(note.id)}
                    >
                      <MaterialIcons name="push-pin" size={16} color="#2196F3" />
                    </TouchableOpacity>
                  )}
                  
                  {note.favorite && (
                    <TouchableOpacity 
                      style={styles.iconContainer}
                      // onPress={() => onFavorite && onFavorite(note.id)}
                    >
                      <MaterialIcons name="star" size={16} color="#FFC107" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

const selectionStyles = {
  selectionIndicator: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 10,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#536DFE',
  },
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pinnedCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  content: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
    overflow: 'hidden',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#9E9E9E',
    marginLeft: 4,
  },
  rightActions: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  deleteButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 70,
  },
  deleteButton: {
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25, // Make it round
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    marginLeft: 6,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  iconContainer: {
    marginLeft: 6,
    padding: 2,
  },
  ...selectionStyles,
});

export default NoteCard;
