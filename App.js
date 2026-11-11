import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [deviceToken, setDeviceToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setDeviceToken(token);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Người dùng bấm vào thông báo:", response.notification.request.content.data);
    });

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LAB1: Nhận Push Notification</Text>
      <Text style={styles.tokenText}>FCM Device Token (Dùng cho LAB2):</Text>
      <Text selectable={true} style={styles.tokenValue}>
        {deviceToken || 'Đang lấy token...'}
      </Text>
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token = null;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Bạn chưa cấp quyền nhận thông báo!');
      return null;
    }
    
    try {
      // Sử dụng getDevicePushTokenAsync() để lấy trực tiếp FCM Token mà không phụ thuộc EAS Project ID
      const response = await Notifications.getDevicePushTokenAsync();
      token = response.data;
      console.log("FCM Device Token:", token);
    } catch (error) {
      console.log("Lỗi khi lấy Device Token:", error);
    }
  } else {
    alert('Vui lòng chạy trên thiết bị thật mới nhận được Push Notification!');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  tokenText: { marginTop: 10, fontWeight: '600', color: '#555' },
  tokenValue: { marginTop: 8, padding: 12, backgroundColor: '#f2f2f2', textAlign: 'center', color: '#007AFF', fontSize: 11, borderRadius: 6 }
});