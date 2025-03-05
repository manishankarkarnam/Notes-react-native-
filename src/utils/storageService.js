// Make sure AsyncStorage is properly imported at the top of the file

// If you're using Expo or React Native's AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';
// OR for older versions:
// import { AsyncStorage } from 'react-native';
import uuid from 'react-native-uuid';

const NOTES_STORAGE_KEY = 'notes_data';

// Get all notes
export const getAllNotes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

// Save a new note
export const saveNote = async (noteData) => {
  try {
    const notes = await getAllNotes();
    const newNote = {
      id: uuid.v4(),
      ...noteData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedNotes = [newNote, ...notes];
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes));
    return newNote;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

// Get a specific note by ID
export const getNoteById = async (id) => {
  try {
    const notes = await getAllNotes();
    return notes.find(note => note.id === id);
  } catch (error) {
    console.error('Error getting note by ID:', error);
    return null;
  }
};

// Update an existing note
export const updateNote = async (id, updatedData) => {
  try {
    const notes = await getAllNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    
    if (noteIndex !== -1) {
      notes[noteIndex] = {
        ...notes[noteIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      return notes[noteIndex];
    }
    return null;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete a note - Fix the syntax error here
export const deleteNote = async (id) => {
  try {
    const notes = await getAllNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filteredNotes));
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Add bulk operation methods to the storage service

// Add a bulk update function to properly persist multiple changes
export const bulkUpdateNotes = async (noteIds, updates) => {
  try {
    // Get all notes first
    let allNotes = await getAllNotes();
    
    // Create a map of updated notes with their new values
    const updatedNotes = [];
    
    // Update each note in the array
    allNotes = allNotes.map(note => {
      if (noteIds.includes(note.id)) {
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        updatedNotes.push(updatedNote);
        return updatedNote;
      }
      return note;
    });
    
    // Save all notes back to storage in one operation
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(allNotes));
    
    return updatedNotes;
  } catch (error) {
    console.error('Failed to bulk update notes:', error);
    throw error;
  }
};

// Add a bulk delete function to properly remove multiple notes
export const bulkDeleteNotes = async (noteIds) => {
  try {
    // Get all notes first
    let allNotes = await getAllNotes();
    
    // Filter out the notes to be deleted
    const filteredNotes = allNotes.filter(note => !noteIds.includes(note.id));
    
    // Save the remaining notes back to storage
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(filteredNotes));
    
    return true;
  } catch (error) {
    console.error('Failed to bulk delete notes:', error);
    throw error;
  }
};
