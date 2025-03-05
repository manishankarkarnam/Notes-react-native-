import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Animated,
  ActivityIndicator,
  Keyboard,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import NoteCard from '../components/NoteCard';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'recent_searches';

const SearchScreen = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { notes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [focused, setFocused] = useState(true);
  
  const searchInFavorites = route.params?.searchInFavorites || false;
  const initialSource = route.params?.initialSource || 'all';
  
  const filteredNoteSource = React.useMemo(() => {
    return searchInFavorites 
      ? notes.filter(note => note.favorite) 
      : notes;
  }, [notes, searchInFavorites]);
  
  const inputRef = useRef(null);
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const resultsAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    };
    
    loadRecentSearches();
    
    Animated.stagger(200, [
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(resultsAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  }, []);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const searchTimeout = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      
      const results = filteredNoteSource.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    
    return () => clearTimeout(searchTimeout);
  }, [searchQuery, filteredNoteSource]);
  
  const saveRecentSearch = async (query) => {
    if (!query.trim() || recentSearches.includes(query.trim())) return;
    
    try {
      const newRecentSearches = [query.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(newRecentSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecentSearches));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  };
  
  const handleNotePress = (note) => {
    saveRecentSearch(searchQuery);
    
    navigation.navigate('NoteDetail', { noteId: note.id });
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };
  
  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    inputRef.current?.focus();
  };
  
  const handleClearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  };

  const renderEmptyResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      );
    }
    
    if (searchQuery.trim() === '') {
      return (
        <View style={styles.emptyContainer}>
          <LottieView
            source={require('../../assets/search.json')}
            style={styles.lottie}
            autoPlay
            loop
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {searchInFavorites ? 'Search in favorites' : 'Search for notes'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
            {searchInFavorites 
              ? 'Find your favorite notes by title, content, or tags' 
              : 'Find your notes by title, content, or tags'
            }
          </Text>
          
          {recentSearches.length > 0 && (
            <View style={styles.recentSearchesContainer}>
              <View style={styles.recentSearchesHeader}>
                <Text style={[styles.recentSearchesTitle, { color: theme.text }]}>Recent searches</Text>
                <TouchableOpacity onPress={handleClearRecentSearches}>
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              </View>
              
              {recentSearches.map((query, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.recentSearchItem}
                  onPress={() => handleRecentSearchPress(query)}
                >
                  <MaterialIcons name="history" size={16} color={theme.icon} />
                  <Text style={[styles.recentSearchText, { color: theme.text }]}>{query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <LottieView
          source={require('../../assets/no-results.json')}
          style={styles.lottie}
          autoPlay
          loop
        />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
          {searchInFavorites 
            ? 'No favorite notes match your search' 
            : 'Try searching with different keywords'
          }
        </Text>
      </View>
    );
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      
      <Animated.View 
        style={[
          styles.searchBarContainer,
          { 
            opacity: searchBarAnim,
            transform: [{ translateY: searchBarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0]
            })}],
            backgroundColor: theme.background, // Updated to use theme.background instead of hard-coded white
            borderBottomWidth: 1,
            borderBottomColor: theme.border // Updated to use theme.border
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.icon} />
        </TouchableOpacity>
        
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: theme.inputBackground // Updated to use theme.inputBackground 
          }
        ]}>
          <MaterialIcons name="search" size={22} color={theme.icon} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={searchInFavorites ? "Search in favorites..." : "Search notes, tags..."}
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <MaterialIcons name="close" size={22} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      <View style={[styles.filterContainer, { backgroundColor: theme.background }]}>
        <View 
          style={[
            styles.filterTag,
            { 
              backgroundColor: initialSource === 'favorites' 
                ? `${theme.accent}20` 
                : theme.buttonBackground 
            }
          ]}
        >
          <MaterialIcons 
            name={initialSource === 'favorites' ? 'star' : 'notes'} 
            size={16} 
            color={initialSource === 'favorites' ? theme.accent : theme.icon} 
          />
          <Text 
            style={[
              styles.filterTagText, 
              { 
                color: initialSource === 'favorites' 
                  ? theme.accent 
                  : theme.secondaryText 
              }
            ]}
          >
            {initialSource === 'favorites' ? 'Favorites' : 'All Notes'}
          </Text>
        </View>
      </View>
      
      <Animated.View 
        style={[
          styles.resultsContainer,
          {
            opacity: resultsAnim,
            transform: [{ translateY: resultsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }
        ]}
      >
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item)}
            />
          )}
          contentContainerStyle={[
            styles.notesList,
            searchResults.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyResults}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor value is applied via inline style with theme
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Background and border colors are applied via inline style with theme
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    // Background color is applied via inline style with theme
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 4,
    // Text color is applied via inline style with theme
  },
  resultsContainer: {
    flex: 1,
  },
  notesList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recentSearchesContainer: {
    alignSelf: 'stretch',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  clearText: {
    fontSize: 14,
    color: '#536DFE',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)', // Updated to be compatible with dark mode
  },
  recentSearchText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterTagText: {
    fontSize: 13,
    marginLeft: 4,
    color: '#757575',
  },
});

export default SearchScreen;