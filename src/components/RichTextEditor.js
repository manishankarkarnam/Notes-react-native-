import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const { width } = Dimensions.get('window');

// A simplified rich text editor component
const RichEditor = forwardRef(({ initialValue = '', onChange, placeholder, showFormatting }, ref) => {
  const { theme } = useTheme(); // Get current theme
  const [currentText, setCurrentText] = useState(initialValue);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [formattedSegments, setFormattedSegments] = useState([]);
  
  const inputRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    setBold: () => toggleFormat('bold'),
    setItalic: () => toggleFormat('italic'),
    setUnderline: () => toggleFormat('underline'),
    setStrikethrough: () => toggleFormat('strikethrough'),
    setHighlight: () => toggleFormat('highlight'),
    setBulletList: () => addListItem('bullet'),
    setOrderedList: () => addListItem('ordered'),
    setIndent: () => addIndent(),
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  const toggleFormat = (formatType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // In a real implementation, this would apply formatting to the selected text
    // For this example, we'll just add a sample indicator
    if (selection.start !== selection.end) {
      const newFormattedSegment = {
        start: selection.start,
        end: selection.end,
        type: formatType,
        text: currentText.substring(selection.start, selection.end)
      };
      
      setFormattedSegments([...formattedSegments, newFormattedSegment]);
    }
  };

  const addListItem = (listType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Insert a bullet point or number at the current cursor position
    const prefix = listType === 'bullet' ? '• ' : '1. ';
    const textBeforeCursor = currentText.substring(0, selection.start);
    const textAfterCursor = currentText.substring(selection.start);
    
    // Check if we're at the beginning of a line
    const isLineStart = selection.start === 0 || 
                        textBeforeCursor.charAt(textBeforeCursor.length - 1) === '\n';
    
    const newPrefix = isLineStart ? prefix : '\n' + prefix;
    const newText = textBeforeCursor + newPrefix + textAfterCursor;
    
    setCurrentText(newText);
    
    // Update cursor position
    const newPosition = selection.start + newPrefix.length;
    setSelection({ start: newPosition, end: newPosition });
    
    // Notify parent of the change
    onChange(newText);
  };

  const addIndent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Insert tab or spaces for indentation
    const indentation = '    '; // 4 spaces for indentation
    const textBeforeCursor = currentText.substring(0, selection.start);
    const textAfterCursor = currentText.substring(selection.start);
    
    const newText = textBeforeCursor + indentation + textAfterCursor;
    
    setCurrentText(newText);
    
    // Update cursor position
    const newPosition = selection.start + indentation.length;
    setSelection({ start: newPosition, end: newPosition });
    
    // Notify parent of the change
    onChange(newText);
  };

  // Handle text changes
  const handleChangeText = (text) => {
    setCurrentText(text);
    onChange(text);
  };

  // Handle selection changes
  const handleSelectionChange = (event) => {
    setSelection(event.nativeEvent.selection);
  };

  // In a real implementation, we would render formatted text
  // This is a simplified version that just renders the plain text
  const renderFormattingIndicator = () => {
    if (formattedSegments.length > 0 && selection.start !== selection.end) {
      // Check if current selection has any formatting
      const activeFormats = formattedSegments.filter(
        segment => segment.start <= selection.start && segment.end >= selection.end
      );
      
      if (activeFormats.length > 0) {
        return (
          <View style={[styles.formattingIndicator, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            {activeFormats.map((format, index) => (
              <Text key={index} style={styles.formattingText}>
                {format.type}
              </Text>
            ))}
          </View>
        );
      }
    }
    
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: `${theme.card}80` }]}>
      {showFormatting && renderFormattingIndicator()}
      <TextInput
        ref={inputRef}
        style={[styles.editor, { color: theme.text }]}
        multiline
        value={currentText}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        textAlignVertical="top"
        autoCapitalize="sentences"
        autoCorrect
      />
    </View>
  );
});

// Add a separate ColorPalette component to be reused
const ColorPalette = ({ colors, selectedColor, onSelect }) => {
  const { theme } = useTheme(); // Get current theme
  
  return (
    <View style={styles.colorPalette}>
      {colors.map((color, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            selectedColor === color && [styles.selectedColorOption, { borderColor: theme.accent }]
          ]}
          onPress={() => onSelect(color)}
        >
          {selectedColor === color && (
            <MaterialIcons 
              name="check" 
              size={16} 
              color={color === '#FFFFFF' ? '#000' : '#FFF'} 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    minHeight: 200,
    padding: 12,
  },
  editor: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  formattingIndicator: {
    position: 'absolute',
    top: -30,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    zIndex: 1000,
  },
  formattingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginRight: 8,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#536DFE',
  },
});

export { RichEditor };
export default RichEditor;
