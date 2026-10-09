import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Listing } from '../types';

interface ListingCardProps {
  item: Listing;
  onContact: (item: Listing) => void;
  onPress: () => void; // <--- እዚህ ላይ ተጨምሯል
}

export const ListingCard: React.FC<ListingCardProps> = ({ item, onContact, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.owner}>ለቃሚ/ባለቤት: {item.ownerName}</Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => onContact(item)}
        >
          <Text style={styles.buttonText}>💬 ደውል / ቻት አድርግ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  details: {
    padding: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#075E54',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#222',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  location: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  owner: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#075E54',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
