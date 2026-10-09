import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageView from 'react-native-image-viewing';
import { Listing } from '../types';

const { width } = Dimensions.get('window');

interface ListingDetailModalProps {
  visible: boolean;
  item: Listing | null;
  onClose: () => void;
  onContact: (item: Listing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  visible,
  item,
  onClose,
  onContact,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!item) return null;

  // ፎቶዎች ከሌሉ ወይም 1 ብቻ ከሆነ Array ያዘጋጃል
  const imageList = item.images && item.images.length > 0 ? item.images : [item.imageUrl];
  const formattedImages = imageList.map((url) => ({ uri: url }));

  const handleCall = () => {
    if (item.phone) {
      Linking.openURL(`tel:${item.phone}`);
    }
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  const openFullImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Full Screen Image Viewer Modal */}
        <ImageView
          images={formattedImages}
          imageIndex={selectedImageIndex}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
          swipeToCloseEnabled={true}
          doubleTapToZoomEnabled={true}
          HeaderComponent={() => (
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                onPress={() => setIsImageViewerVisible(false)}
                style={styles.closeImageBtn}
              >
                <Text style={styles.closeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ ተመለስ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Image Carousel / Slider */}
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {imageList.map((imgUri, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => openFullImage(index)}
                >
                  <Image source={{ uri: imgUri }} style={styles.slideImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {imageList.length > 1 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {activeIndex + 1} / {imageList.length} (ወደ ጎን ሳብ)
                </Text>
              </View>
            )}
          </View>

          {/* Details Section */}
          <View style={styles.infoContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{item.price}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionHeader}>የባለቤቱ / የደላላው መረጃ</Text>
            <Text style={styles.ownerText}>👤 ስም፦ {item.ownerName || 'አልተጠቀሰም'}</Text>
            <Text style={styles.ownerText}>📞 ስልክ፦ {item.phone}</Text>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Text style={styles.actionBtnText}>📞 ደውል</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => {
              onClose();
              onContact(item);
            }}
          >
            <Text style={styles.actionBtnText}>💬 ቻት አድርግ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#075E54',
  },
  backBtn: { paddingRight: 12 },
  backBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  content: { flex: 1 },
  carouselContainer: { width, height: 260, position: 'relative', backgroundColor: '#000' },
  slideImage: { width, height: 260, resizeMode: 'cover' },
  badgeContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  infoContainer: { padding: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#075E54' },
  categoryBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: '#075E54', fontWeight: 'bold', fontSize: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 8 },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#075E54', marginBottom: 8 },
  ownerText: { fontSize: 14, color: '#444', marginBottom: 4 },
  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  chatBtn: {
    flex: 1,
    backgroundColor: '#075E54',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  imageViewerHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 999,
  },
  closeImageBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
