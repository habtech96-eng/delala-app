import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Listing } from '../types';

interface AddListingModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (newListing: Listing) => void;
}

export const AddListingModal: React.FC<AddListingModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<'House' | 'Car' | 'Land' | 'Other'>('House');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // ከ ጋላሪ ከ 1 በላይ ፎቶዎችን መምረጫ function
  const pickImages = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('ፈቃድ ያስፈልጋል', 'ፎቶዎችን ለመምረጫ የጋላሪ ፈቃድ መስጠት አለብዎት!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // <--- የወደፊቱን Warning የሚያጠፋው አዲሱ መንገድ
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedUris]);
    }
  };

  // የተመረጠውን ፎቶ የማስወገጃ function
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = () => {
    if (!title || !price || !location || !phone || !ownerName) {
      Alert.alert('ስህተት', 'እባክዎን ሁሉንም ቦታዎች በትክክል ይሙሉ!');
      return;
    }

    const firstImage = images.length > 0 
      ? images[0] 
      : 'https://picsum.photos/400/300?random=' + Math.floor(Math.random() * 100);

    const newListing: Listing = {
      id: Date.now().toString(),
      title,
      price,
      location,
      category,
      imageUrl: firstImage,
      images: images.length > 0 ? images : [firstImage],
      phone,
      ownerName,
    };

    onAdd(newListing);
    
    // Form Reset ማድረግ
    setTitle('');
    setPrice('');
    setLocation('');
    setPhone('');
    setOwnerName('');
    setImages([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>➕ አዲስ እቃ/ቤት መለጠፊያ</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>ዘጋ (X)</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>ምድብ (Category)</Text>
          <View style={styles.categoryContainer}>
            {(['House', 'Car', 'Land', 'Other'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBadge,
                  category === cat && styles.activeCategory,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.activeCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ፎቶዎች መምረጫ Section */}
          <Text style={styles.label}>የእቃው/የቤቱ ፎቶዎች ({images.length} ተመርጠዋል)</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImages}>
            <Text style={styles.imagePickerText}>📷 ከጋላሪ ፎቶዎችን ምረጥ (ከ 1 በላይ)</Text>
          </TouchableOpacity>

          {/* የተመረጡ ፎቶዎች ቅድመ-እይታ (Preview List) */}
          {images.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true} 
              style={styles.previewContainer}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeBadge}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>ርዕስ (ለምሳሌ፦ ቪላ ቤት ለኪራይ)</Text>
          <TextInput
            style={styles.input}
            placeholder="ርዕስ ያስገቡ..."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>ዋጋ (ለምሳሌ፦ 30,000 ETB)</Text>
          <TextInput
            style={styles.input}
            placeholder="ዋጋ ያስገቡ..."
            value={price}
            onChangeText={setPrice}
          />

          <Text style={styles.label}>ቦታ (Location)</Text>
          <TextInput
            style={styles.input}
            placeholder="ለምሳሌ፦ ቦሌ፣ አዲስ አበባ"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>የባለቤቱ/ደላላው ስም</Text>
          <TextInput
            style={styles.input}
            placeholder="ስም ያስገቡ..."
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <Text style={styles.label}>የስልክ ቁጥር</Text>
          <TextInput
            style={styles.input}
            placeholder="09..."
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>ፖስት አድርግ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#075E54',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  closeText: { color: '#ffdddd', fontSize: 16, fontWeight: 'bold' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  categoryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#075E54',
  },
  activeCategory: { backgroundColor: '#075E54' },
  categoryText: { color: '#075E54', fontWeight: 'bold' },
  activeCategoryText: { color: '#fff' },
  imagePickerBtn: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#25D366',
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerText: { color: '#075E54', fontWeight: 'bold', fontSize: 14 },
  previewContainer: { flexDirection: 'row', marginBottom: 15, paddingTop: 5, paddingBottom: 5 },
  imageWrapper: { marginRight: 12, position: 'relative' },
  previewImage: { width: 90, height: 90, borderRadius: 8 },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  removeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  submitBtn: {
    backgroundColor: '#075E54',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 40,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
