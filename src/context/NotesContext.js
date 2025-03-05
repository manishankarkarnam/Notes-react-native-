import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  getAllNotes, 
  saveNote, 
  updateNote, 
  deleteNote,
  bulkUpdateNotes,
  bulkDeleteNotes
} from '../utils/storageService';
import { Text, View } from 'react-native';

const NotesContext = createContext({});

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const storedNotes = await getAllNotes();
      setNotes(storedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNote = useCallback(async (noteData) => {
    try {
      const newNote = await saveNote(noteData);
      setNotes(prevNotes => [newNote, ...prevNotes]);
      return newNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  }, []);

  const editNote = useCallback(async (id, updatedData) => {
    try {
      const updatedNote = await updateNote(id, updatedData);
      if (updatedNote) {
        setNotes(prevNotes => 
          prevNotes.map(note => note.id === id ? updatedNote : note)
        );
      }
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }, []);

  const removeNote = useCallback(async (id) => {
    try {
      await deleteNote(id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }, []);

  const bulkEditNotes = useCallback(async (noteIds, updates) => {
    try {
      const updatedNotes = await bulkUpdateNotes(noteIds, updates);
      setNotes(prevNotes => {
        return prevNotes.map(note => {
          if (noteIds.includes(note.id)) {
            const updatedNote = updatedNotes.find(un => un.id === note.id);
            return updatedNote || note;
          }
          return note;
        });
      });
      return updatedNotes;
    } catch (error) {
      console.error('Failed to bulk edit notes:', error);
      throw error;
    }
  }, []);

  const bulkRemoveNotes = useCallback(async (noteIds) => {
    try {
      await bulkDeleteNotes(noteIds);
      setNotes(prevNotes => prevNotes.filter(note => !noteIds.includes(note.id)));
      return true;
    } catch (error) {
      console.error('Failed to bulk delete notes:', error);
      throw error;
    }
  }, []);

  const value = React.useMemo(() => ({
    notes,
    loading,
    addNote,
    editNote,
    removeNote,
    bulkEditNotes,
    bulkRemoveNotes,
    refreshNotes: loadNotes
  }), [notes, loading, addNote, editNote, removeNote, bulkEditNotes, bulkRemoveNotes, loadNotes]);

  return (
    <NotesContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {React.Children.map(children, child => 
          typeof child === 'string' ? null : child
        )}
      </View>
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export default NotesContext;
