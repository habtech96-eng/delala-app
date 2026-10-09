import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

interface BottomNavProps {
  activeTab: 'home' | 'post' | 'profile';
  onTabPress: (tab: 'home' | 'post' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('home')}>
        <Text style={[styles.icon, activeTab === 'home' && styles.activeIcon]}>🏠</Text>
        <Text style={[styles.label, activeTab === 'home' && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('post')}>
        <View style={styles.postIconWrapper}>
          <Text style={styles.postIconText}>+</Text>
        </View>
        <Text style={[styles.label, activeTab === 'post' && styles.activeLabel]}>Post</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('profile')}>
        <Text style={[styles.icon, activeTab === 'profile' && styles.activeIcon]}>👤</Text>
        <Text style={[styles.label, activeTab === 'profile' && styles.activeLabel]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  icon: { fontSize: 18, opacity: 0.5 },
  activeIcon: { opacity: 1 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#777', marginTop: 1 },
  activeLabel: { color: '#075E54' },
  postIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postIconText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: -2 },
});
