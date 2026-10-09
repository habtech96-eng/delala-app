import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('chat.db');

interface HeaderProps {
  user: { phone: string; fullName: string } | null;
  onOpenAuth: () => void;
  onOpenAddListing: () => void;
  onLogoutSuccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuth,
  onOpenAddListing,
  onLogoutSuccess,
}) => {
  const handleLogout = () => {
    Alert.alert('ከመለያ መውጣት', 'እርግጠኛ ነዎት ከመለያዎ መውጣት ይፈልጋሉ?', [
      { text: 'ተው', style: 'cancel' },
      {
        text: 'ውጣ',
        style: 'destructive',
        onPress: () => {
          try {
            db.runSync('DELETE FROM user_session;');
            onLogoutSuccess();
            Alert.alert('ተሳክቷል', 'በስኬት ወጥተዋል!');
          } catch (e) {
            console.error('Logout error:', e);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>🏠 ደላላ (Delala App)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenAddListing}>
          <Text style={styles.addBtnText}>+ ፖስት አድርግ</Text>
        </TouchableOpacity>
      </View>

      {user ? (
        <View style={styles.userRow}>
          <Text style={styles.subTitle}>
            👤 እንኳን ደህና መጡ {user.fullName || user.phone}!
          </Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>🚪 ውጣ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onOpenAuth}>
          <Text style={[styles.subTitle, { textDecorationLine: 'underline' }]}>
            🔐 ለመግባት / ለመመዝገብ እዚህ ይጫኑ
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 12, color: '#e0e0e0', marginTop: 4 },
  addBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: '#ffcdd2',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
