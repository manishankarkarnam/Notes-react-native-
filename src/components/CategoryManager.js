import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const SAMPLE_CATEGORIES = [
  { id: '1', name: 'Personal', color: '#F06292', notesCount: 4 },
  { id: '2', name: 'Work', color: '#4FC3F7', notesCount: 7 },
  { id: '3', name: 'Ideas', color: '#AED581', notesCount: 2 },
  { id: '4', name: 'Todos', color: '#FFD54F', notesCount: 5 },
];

const CategoryManager = ({ onSelectCategory, onCreateCategory, onDeleteCategory, selectedCategoryId }) => {
  const [categories, setCategories] = useState(SAMPLE_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#F06292');
  
  const createAnim = new Animated.Value(showCreate ? 1 : 0);
  
  useEffect(() => {
    Animated.timing(createAnim, {
      toValue: showCreate ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showCreate]);
  
  const COLORS = [
    '#F06292', // Pink
    '#4FC3F7', // Blue
    '#AED581', // Green
    '#FFD54F', // Yellow
    '#FF8A65', // Orange
    '#9575CD', // Purple
    '#4DD0E1', // Teal
    '#F48FB1', // Light Pink
  ];
  
  const handleCreateCategory = () => {
    if (newCategoryName.trim() === '') {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    
    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: selectedColor,
      notesCount: 0
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setShowCreate(false);
    
    if (onCreateCategory) {
      onCreateCategory(newCategory);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  const handleDeleteCategory = (id) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? Notes in this category won\'t be deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedCategories = categories.filter(cat => cat.id !== id);
            setCategories(updatedCategories);
            
            if (onDeleteCategory) {
              onDeleteCategory(id);
            }
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };
  
  const toggleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCreate(!showCreate);
  };
  
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem, 
        selectedCategoryId === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => {
        onSelectCategory && onSelectCategory(item);
        Haptics.selectionAsync();
      }}
    >
      <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.noteCount}>{item.notesCount} notes</Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialIcons name="delete-outline" size={18} color="#9E9E9E" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity style={styles.addButton} onPress={toggleCreate}>
          <MaterialIcons 
            name={showCreate ? "remove" : "add"} 
            size={20} 
            color="#536DFE"
          />
        </TouchableOpacity>
      </View>
      
      {/* Create new category section */}
      {showCreate && (
        <Animated.View 
          style={[
            styles.createContainer,
            {
              opacity: createAnim,
              maxHeight: createAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Category name"
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoFocus={showCreate}
          />
          
          <View style={styles.colorPicker}>
            <Text style={styles.colorTitle}>Choose a color:</Text>
            <View style={styles.colorList}>
              {COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => {
                    setSelectedColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                />
              ))}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateCategory}
          >
            <Text style={styles.createButtonText}>Create Category</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      
      {/* Categories list */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(83,109,254,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingVertical: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  selectedCategoryItem: {
    backgroundColor: 'rgba(83,109,254,0.08)',
  },
  categoryColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  noteCount: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  deleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  input: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#212121',
  },
  colorPicker: {
    marginTop: 12,
  },
  colorTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    marginBottom: 8,
  },
  colorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#536DFE',
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#536DFE',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CategoryManager;
