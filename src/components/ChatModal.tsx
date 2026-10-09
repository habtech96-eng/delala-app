import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import * as SQLite from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { Listing } from '../types';
import { ImageViewerModal } from './ImageViewerModal';

interface ChatModalProps {
  visible: boolean;
  item: Listing | null;
  onClose: () => void;
}

interface Message {
  id: string;
  room: string;
  author: string;
  text: string;
  time: string;
  imageUrl?: string;
  isEdited?: number;
}

const db = SQLite.openDatabaseSync('chat.db');

export const ChatModal: React.FC<ChatModalProps> = ({ visible, item, onClose }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [myUsername] = useState('ገዢ');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Table መፍጠር (ከነ አዲሶቹ Columns)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY NOT NULL,
        room TEXT NOT NULL,
        author TEXT NOT NULL,
        text TEXT NOT NULL,
        time TEXT NOT NULL,
        imageUrl TEXT,
        isEdited INTEGER DEFAULT 0
      );
    `);

    // 2. ነባር Table ከነበረ Column መኖሩን አረጋግጦ ማከል
    try {
      const tableInfo = db.getAllSync<{ name: string }>('PRAGMA table_info(messages);');
      const hasImageUrl = tableInfo.some((col) => col.name === 'imageUrl');
      const hasIsEdited = tableInfo.some((col) => col.name === 'isEdited');

      if (!hasImageUrl) {
        db.execSync('ALTER TABLE messages ADD COLUMN imageUrl TEXT;');
      }
      if (!hasIsEdited) {
        db.execSync('ALTER TABLE messages ADD COLUMN isEdited INTEGER DEFAULT 0;');
      }
    } catch (e) {
      console.error('Migration error:', e);
    }
  }, []);

  useEffect(() => {
    if (!item) return;

    const roomId = `room_${item.id}`;
    const newSocket = io('http://192.168.8.66:5000', {
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    setSocket(newSocket);
    newSocket.emit('join_room', { username: myUsername, room: roomId });

    const rows = db.getAllSync<Message>(
      'SELECT * FROM messages WHERE room = ? ORDER BY id ASC;',
      [roomId]
    );
    setMessages(rows);

    const handleReceive = (data: Message) => {
      db.runSync(
        'INSERT OR REPLACE INTO messages (id, room, author, text, time, imageUrl, isEdited) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [data.id, data.room, data.author, data.text, data.time, data.imageUrl || '', data.isEdited || 0]
      );
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) {
          return prev.map((m) => (m.id === data.id ? data : m));
        }
        return [...prev, data];
      });
    };

    const handleDeleteReceive = (messageId: string) => {
      db.runSync('DELETE FROM messages WHERE id = ?;', [messageId]);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    newSocket.on('receive_message', handleReceive);
    newSocket.on('delete_message', handleDeleteReceive);

    return () => {
      newSocket.off('receive_message', handleReceive);
      newSocket.off('delete_message', handleDeleteReceive);
      newSocket.disconnect();
    };
  }, [item, visible]);

  // መልእክት መላክ እና ኤዲት ማድረግ
  const sendMessage = (imageUrl?: string) => {
    if ((!inputText.trim() && !imageUrl) || !item || !socket) return;

    const roomId = `room_${item.id}`;

    if (editingMessageId) {
      const updatedText = inputText.trim();
      db.runSync('UPDATE messages SET text = ?, isEdited = 1 WHERE id = ?;', [
        updatedText,
        editingMessageId,
      ]);

      const updatedMessage = messages.find((m) => m.id === editingMessageId);
      if (updatedMessage) {
        const newMsgData = { ...updatedMessage, text: updatedText, isEdited: 1 };
        socket.emit('send_message', newMsgData);
      }

      setEditingMessageId(null);
      setInputText('');
      return;
    }

    const messageData: Message = {
      id: Date.now().toString(),
      room: roomId,
      author: myUsername,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: imageUrl || '',
      isEdited: 0,
    };

    db.runSync(
      'INSERT INTO messages (id, room, author, text, time, imageUrl, isEdited) VALUES (?, ?, ?, ?, ?, ?, ?);',
      [
        messageData.id,
        messageData.room,
        messageData.author,
        messageData.text,
        messageData.time,
        messageData.imageUrl || '',
        0,
      ]
    );

    socket.emit('send_message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setInputText('');
  };

  // ካሜራ ወይም ጋላሪ በመጠቀም ፎቶ መላክ
  const handlePickImage = async (useCamera = false) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('ፈቃድ ያስፈልጋል', 'እባክዎን የፎቶ/ካሜራ ፈቃድ ይስጡ');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });

    if (!result.canceled && result.assets[0]?.uri) {
      sendMessage(result.assets[0].uri);
    }
  };

  // Long Press ሲደረግ Edit / Delete ማድረጊያ Option
  const handleLongPress = (msg: Message) => {
    if (msg.author !== myUsername) return;

    Alert.alert('የመልእክት አማራጮች', 'ምን ማድረግ ይፈልጋሉ?', [
      {
        text: '✏️ ኤዲት አድርግ',
        onPress: () => {
          setEditingMessageId(msg.id);
          setInputText(msg.text);
        },
      },
      {
        text: '🗑️ ሰርዝ (Delete)',
        style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM messages WHERE id = ?;', [msg.id]);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          socket?.emit('delete_message', { id: msg.id, room: msg.room });
        },
      },
      { text: 'ተው (Cancel)', style: 'cancel' },
    ]);
  };

  if (!item) return null;

  const avatarLetter = item.ownerName ? item.ownerName.charAt(0).toUpperCase() : 'ደ';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {item.ownerName || 'የዕቃው ባለቤት'}
              </Text>

              <Text style={styles.itemSubTitle} numberOfLines={1}>
                📌 {item.title}
              </Text>
            </View>
          </View>

          {/* Message List */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item: msg }) => {
              const isMe = msg.author === myUsername;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onLongPress={() => handleLongPress(msg)}
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.otherMessage,
                  ]}
                >
                  {!isMe && <Text style={styles.authorText}>{msg.author}</Text>}

                  {msg.imageUrl ? (
                    <TouchableOpacity onPress={() => setSelectedImage(msg.imageUrl || null)}>
                      <Image source={{ uri: msg.imageUrl }} style={styles.chatImage} />
                    </TouchableOpacity>
                  ) : null}

                  {msg.text ? (
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                      {msg.text}
                    </Text>
                  ) : null}

                  <View style={styles.footerRow}>
                    {msg.isEdited ? <Text style={styles.editedTag}>እርማት የተደረገበት • </Text> : null}
                    <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.otherTimeText]}>
                      {msg.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {/* Edit Mode Warning Bar */}
          {editingMessageId && (
            <View style={styles.editingBar}>
              <Text style={styles.editingText}>✏️ መልእክት በማስተካከል ላይ...</Text>
              <TouchableOpacity onPress={() => { setEditingMessageId(null); setInputText(''); }}>
                <Text style={styles.cancelEditText}>✕ ተው</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => handlePickImage(true)}>
              <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={() => handlePickImage(false)}>
              <Text style={styles.iconText}>🖼️</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="መልእክት ይጻፉ..."
              placeholderTextColor="#888"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                inputText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim()}
            >
              <Text style={styles.sendIcon}>➔</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Full Screen Image Modal */}
        <ImageViewerModal
          visible={!!selectedImage}
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#075E54',
    elevation: 4,
  },
  backButton: { paddingRight: 8, paddingLeft: 4 },
  backIcon: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  avatarContainer: { position: 'relative', marginRight: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#075E54',
  },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemSubTitle: { color: '#B2DFDB', fontSize: 12, marginTop: 1 },
  messagesList: { paddingHorizontal: 12, paddingVertical: 16 },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  authorText: { fontSize: 11, fontWeight: 'bold', color: '#075E54', marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#000' },
  otherMessageText: { color: '#222' },
  chatImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 5 },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  editedTag: { fontSize: 9, color: '#888', fontStyle: 'italic' },
  timeText: { fontSize: 10 },
  myTimeText: { color: '#556B2F' },
  otherTimeText: { color: '#888' },
  editingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#ffeeba',
  },
  editingText: { color: '#856404', fontSize: 12, fontWeight: 'bold' },
  cancelEditText: { color: '#d9534f', fontSize: 12, fontWeight: 'bold' },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconBtn: { padding: 6, marginRight: 2 },
  iconText: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: { backgroundColor: '#075E54' },
  sendButtonDisabled: { backgroundColor: '#B0BEC5' },
  sendIcon: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
