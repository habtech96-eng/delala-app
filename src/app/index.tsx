import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { Listing } from '../types';
import { ListingCard } from '../components/ListingCard';
import { AddListingModal } from '../components/AddListingModal';
import { ChatModal } from '../components/ChatModal';
import { ListingDetailModal } from '../components/ListingDetailModal';
import { AuthModal } from '../components/AuthModal';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

const API_URL = 'http://192.168.8.66:5000/api/listings';
const CATEGORIES = ['All', 'House', 'Car', 'Land', 'Other'] as const;

const db = SQLite.openDatabaseSync('chat.db');

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'home' | 'post' | 'profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Auth & User States
  const [user, setUser] = useState<{ phone: string; fullName: string } | null>(null);
  const [isAuthVisible, setIsAuthVisible] = useState(false);

  // Modals
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [selectedDetailListing, setSelectedDetailListing] = useState<Listing | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);

  // SQLite Session Check
  const checkUserSession = async () => {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS user_session (
          id INTEGER PRIMARY KEY NOT NULL,
          phone TEXT NOT NULL,
          fullName TEXT
        );
      `);
      const rows = db.getAllSync<{ phone: string; fullName: string }>(
        'SELECT * FROM user_session LIMIT 1;'
      );
      if (rows.length > 0) {
        setUser(rows[0]);
      }
    } catch (e) {
      console.error('Session Error:', e);
    }
  };

  const saveUserSession = (userData: { phone: string; fullName: string }) => {
    try {
      db.runSync('DELETE FROM user_session;');
      db.runSync('INSERT INTO user_session (phone, fullName) VALUES (?, ?);', [
        userData.phone,
        userData.fullName,
      ]);
      setUser(userData);
    } catch (e) {
      console.error('Save Session Error:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert('ከመለያ መውጣት', 'እርግጠኛ ነዎት ከመለያዎ መውጣት ይፈልጋሉ?', [
      { text: 'ተው', style: 'cancel' },
      {
        text: 'ውጣ',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync('DELETE FROM user_session;');
            setUser(null);
            setActiveTab('home');
            Alert.alert('ተሳክቷል', 'በስኬት ወጥተዋል!');
          } catch (e) {
            console.error('Logout error:', e);
          }
        },
      },
    ]);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const json = await response.json();
      if (json.success) {
        setListings(json.data);
      }
    } catch (error) {
      console.error('Listings ማውጣት አልተቻለም:', error);
      Alert.alert('ስህተት', 'ከሰርቨር ጋር መገናኘት አልተቻለም!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
    fetchListings();
  }, []);

  const handleAddListing = async (newListing: Listing) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing),
      });

      const json = await response.json();
      if (json.success) {
        setListings((prev) => [json.data, ...prev]);
        Alert.alert('ተሳክቷል', 'እቃው/ቤቱ በስኬት ተለጥፏል!');
      } else {
        Alert.alert('ስህተት', json.message || 'መለጠፍ አልተቻለም');
      }
    } catch (error) {
      console.error('Listing መላክ አልተቻለም:', error);
      Alert.alert('ስህተት', 'መረጃውን መላክ አልተቻለም!');
    }
  };

  const handleContact = (item: Listing) => {
    if (!user) {
      setIsAuthVisible(true);
      return;
    }
    setSelectedListing(item);
    setIsChatVisible(true);
  };

  const handlePostClick = () => {
    if (!user) {
      setIsAuthVisible(true);
      return;
    }
    setIsModalVisible(true);
  };

  const handleTabPress = (tab: 'home' | 'post' | 'profile') => {
    if (tab === 'post') {
      handlePostClick();
      return;
    }
    if (tab === 'profile') {
      if (!user) {
        setIsAuthVisible(true);
      } else {
        setActiveTab('profile');
      }
      return;
    }
    setActiveTab('home');
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <Header user={user} onOpenAuth={() => setIsAuthVisible(true)} />

      {/* Main Content Area - flex: 1 መስጠቱ ቦታውን በሙሉ እንዲይዝ ያደርገዋል */}
      <View style={styles.mainContent}>
        {activeTab === 'profile' && user ? (
          <View style={styles.profileContainer}>
            <View style={styles.profileCard}>
              <View style={styles.avatarBig}>
                <Text style={styles.avatarBigText}>
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : '👤'}
                </Text>
              </View>
              <Text style={styles.profileName}>{user.fullName || 'ተጠቃሚ'}</Text>
              <Text style={styles.profilePhone}>📱 {user.phone}</Text>

              <TouchableOpacity style={styles.logoutCardBtn} onPress={handleLogout}>
                <Text style={styles.logoutCardBtnText}>🚪 ከመለያ ውጣ (Log Out)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.input}
                placeholder="ቤት፣ መኪና፣ ቦታ ፈልግ..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Filter */}
            <View style={styles.categoryWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                      {cat === 'All' ? 'ሁሉንም' : cat === 'House' ? 'ቤት' : cat === 'Car' ? 'መኪና' : cat === 'Land' ? 'ቦታ' : 'ሌሎች'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Listings List */}
            {loading ? (
              <ActivityIndicator size="large" color="#075E54" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredListings}
                keyExtractor={(item) => item.id}
                onRefresh={fetchListings}
                refreshing={loading}
                renderItem={({ item }) => (
                  <ListingCard
                    item={item}
                    onContact={handleContact}
                    onPress={() => {
                      setSelectedDetailListing(item);
                      setIsDetailVisible(true);
                    }}
                  />
                )}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>በዚህ ምድብ ምንም የተገኘ ነገር የለም...</Text>
                }
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />

      {/* Modals */}
      <AddListingModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAdd={handleAddListing}
      />

      <ChatModal
        visible={isChatVisible}
        item={selectedListing}
        onClose={() => setIsChatVisible(false)}
      />

      <ListingDetailModal
        visible={isDetailVisible}
        item={selectedDetailListing}
        onClose={() => setIsDetailVisible(false)}
        onContact={handleContact}
      />

      {/* Phone Auth Modal */}
      <AuthModal
        visible={isAuthVisible}
        onClose={() => setIsAuthVisible(false)}
        onSuccess={(loggedInUser) => {
          saveUserSession(loggedInUser);
          setIsAuthVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  mainContent: { flex: 1 }, // ይህ ዋናው ክፍል ነው (ቦታውን ሙሉ በሙሉ እንዲይዝ)
  searchBox: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryWrapper: { paddingHorizontal: 12, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#075E54' },
  chipText: { fontSize: 13, fontWeight: 'bold', color: '#444' },
  chipTextActive: { color: '#fff' },
  listContainer: { paddingHorizontal: 12, paddingBottom: 20, paddingTop: 6 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
  profileContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
  },
  avatarBig: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBigText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  profilePhone: { fontSize: 14, color: '#666', marginTop: 4 },
  logoutCardBtn: {
    marginTop: 20,
    backgroundColor: '#ffebee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutCardBtnText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 14 },
});
