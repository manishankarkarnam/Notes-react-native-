import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Keyboard
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const TagsInput = ({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  containerStyle,
  maxTags = 10,
}) => {
  const { theme, dark } = useTheme();
  const [text, setText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  
  const addTag = () => {
    if (text.trim() && value.length < maxTags) {
      const newTag = text.trim().toLowerCase();
      // Don't add duplicates
      if (!value.includes(newTag)) {
        const newTags = [...value, newTag];
        onChange(newTags);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setText('');
    }
  };
  
  const removeTag = (index) => {
    const newTags = [...value];
    newTags.splice(index, 1);
    onChange(newTags);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmitEditing = () => {
    addTag();
    Keyboard.dismiss();
  };
  
  const renderTags = () => {
    return value.map((tag, index) => (
      <View 
        key={`${tag}-${index}`} 
        style={[
          styles.tag,
          { backgroundColor: theme.background, borderColor: theme.border }
        ]}
      >
        <Text style={[styles.tagText, { color: theme.secondaryText }]}>#{tag}</Text>
        <TouchableOpacity 
          onPress={() => removeTag(index)}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          style={styles.removeButton}
        >
          <MaterialIcons name="close" size={12} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
    ));
  };
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.5)' },
      containerStyle
    ]}>
      <View style={[
        styles.inputContainer,
        { backgroundColor: theme.inputBackground, borderColor: theme.border },
        inputFocused && [styles.inputContainerFocused, { borderColor: theme.accent }]
      ]}>
        <MaterialIcons name="local-offer" size={20} color={theme.icon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={theme.secondaryText}
          onSubmitEditing={handleSubmitEditing}
          blurOnSubmit={false}
          onFocus={() => setInputFocused(true)}
          onBlur={() => {
            setInputFocused(false);
            if (text.trim()) {
              addTag();
            }
          }}
          returnKeyType="done"
        />
        {text.length > 0 && (
          <TouchableOpacity onPress={addTag}>
            <MaterialIcons name="add-circle" size={20} color={theme.accent} />
          </TouchableOpacity>
        )}
      </View>
      
      {value.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tagScrollContainer}
          contentContainerStyle={styles.tagContainer}
        >
          {renderTags()}
        </ScrollView>
      )}
      
      {value.length >= maxTags && (
        <Text style={[styles.maxTagsReached, { color: '#FF9800' }]}>
          Maximum {maxTags} tags reached
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  inputContainerFocused: {
    borderColor: '#536DFE',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  tagScrollContainer: {
    marginTop: 8,
    maxHeight: 38,
  },
  tagContainer: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  maxTagsReached: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  }
});

export default TagsInput;
