import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_API_URL = 'http://192.168.8.66:5000/api/auth';

interface AuthModalProps {
  visible: boolean;
  onSuccess: (user: { phone: string; fullName: string }) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onSuccess, onClose }) => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. OTP መላክ
  const handleSendOtp = async () => {
    if (!phone.trim() || phone.length < 9) {
      Alert.alert('ስህተት', 'እባክዎን ትክክለኛ የስልክ ቁጥር ያስገቡ');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${AUTH_API_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();

      if (json.success) {
        Alert.alert('የተላከ ኮድ', json.message);
        setStep('OTP');
      } else {
        Alert.alert('ስህተት', json.message || 'OTP መላክ አልተቻለም');
      }
    } catch (err) {
      Alert.alert('ስህተት', 'ከሰርቨር ጋር መገናኘት አልተቻለም');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP ማረጋገጥ እና መግባት
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      Alert.alert('ስህተት', 'እባክዎን ባለ 6 አሃዝ OTP ኮድ ያስገቡ');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${AUTH_API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, fullName }),
      });
      const json = await res.json();

      if (json.success) {
        const userData = json.user || { phone, fullName: fullName || 'ተጠቃሚ' };
        await AsyncStorage.setItem('user_session', JSON.stringify(userData));
        Alert.alert('ተሳክቷል', 'በስኬት ገብተዋል!');
        onSuccess(userData);
      } else {
        Alert.alert('ስህተት', json.message || 'OTP ማረጋገጥ አልተቻለም');
      }
    } catch (err) {
      Alert.alert('ስህተት', 'ከሰርቨር ጋር መገናኘት አልተቻለም');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>📱 በስልክ ቁጥር ይግቡ</Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE'
              ? 'አገልግሎቱን ለመጠቀም የስልክ ቁጥርዎን ያስገቡ'
              : `ወደ ${phone} የተላከውን ባለ 6 አሃዝ ኮድ ያስገቡ`}
          </Text>

          {step === 'PHONE' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="ሙሉ ስም (ምርጫ)"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="የስልክ ቁጥር (ምሳሌ፦ 0911223344)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TouchableOpacity
                style={styles.btn}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>OTP ኮድ ላክ ➔</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="1 2 3 4 5 6"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity
                style={styles.btn}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>አረጋግጥና ግባ ✨</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep('PHONE')}
              >
                <Text style={styles.backBtnText}>‹ የስልክ ቁጥር ቀይር</Text>
              </TouchableOpacity>
            </>
          )}

          {onClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕ ዝጋ</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#075E54', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginVertical: 8 },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginTop: 10,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
  },
  btn: {
    backgroundColor: '#075E54',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: { marginTop: 12, alignItems: 'center' },
  backBtnText: { color: '#075E54', fontSize: 14, fontWeight: 'bold' },
  closeBtn: { marginTop: 16, alignItems: 'center' },
  closeBtnText: { color: '#888', fontSize: 13 },
});
