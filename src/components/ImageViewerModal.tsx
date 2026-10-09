import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import ImageView from 'react-native-image-viewing';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <ImageView
      images={[{ uri: imageUrl }]}
      imageIndex={0}
      visible={visible}
      onRequestClose={onClose}
      swipeToCloseEnabled={true}
      doubleTapToZoomEnabled={true}
      HeaderComponent={() => (
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 999,
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
