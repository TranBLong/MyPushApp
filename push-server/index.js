const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const admin = require('firebase-admin'); // Dùng cho firebase-admin.database() nếu có dùng realtime DB
const cors = require('cors');

// Khởi tạo Firebase Admin SDK với file khóa bảo mật
// const serviceAccount = require('./serviceAccountKey.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// API 1: GỬI THÔNG BÁO ĐẨY THỦ CÔNG (LAB 2)
// ==========================================
app.post('/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;

  // Kiểm tra xem client có truyền lên FCM Device Token hay không
  if (!token) {
    return res.status(400).json({ error: 'Thiếu tham số "token" (FCM Device Token của thiết bị nhận)!' });
  }

  // Cấu trúc gói tin payload gửi tới dịch vụ FCM của Google
  const message = {
    token: token,
    notification: {
      title: title || 'Thông báo từ Server Node.js',
      body: body || 'Xin chào! Đây là thông báo đẩy được gửi thành công từ Backend.'
    },
    data: data || {}
  };

  try {
    // Tiến hành gửi thông báo qua Firebase Cloud Messaging
    const response = await getMessaging().send(message);
    console.log('Gửi thông báo thành công:', response);
    return res.status(200).json({ 
      success: true, 
      message: 'Đã gửi thông báo thành công tới thiết bị!',
      messageId: response 
    });
  } catch (error) {
    console.error('Lỗi khi gửi thông báo:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==========================================
// API 2: NHẬN DỮ LIỆU TỪ THIẾT BỊ IoT & CẢNH BÁO (LAB 3)
// ==========================================
app.post('/api/iot-data', async (req, res) => {
    const { temperature, gasDetected, fireDetected, intruderDetected, fcmToken } = req.body;

    let alertMessage = "";
    let alertTitle = "Cảnh báo nguy hiểm từ IoT!";

    // Kiểm tra các điều kiện cảnh báo theo yêu cầu LAB 3
    if (temperature > 40 || temperature < 10) {
        alertMessage = `Nhiệt độ bất thường: ${temperature}°C!`;
    } else if (gasDetected) {
        alertMessage = "Phát hiện rò rỉ khí gas!";
    } else if (fireDetected) {
        alertMessage = "PHÁT HIỆN CHÁY!";
    } else if (intruderDetected) {
        alertMessage = "Cảnh báo: Có người lạ xâm nhập!";
    }

    // Nếu có cảnh báo, tiến hành gọi Firebase Admin SDK để đẩy thông báo tới App di động
    if (alertMessage) {
        // Kiểm tra xem có truyền fcmToken không để tránh lỗi
        if (!fcmToken) {
            return res.status(400).json({ success: false, error: 'Thiếu tham số fcmToken của thiết bị di động!' });
        }

        const message = {
            token: fcmToken, // Token lấy từ App di động ở Lab 1
            notification: {
                title: alertTitle,
                body: alertMessage,
            },
        };

        try {
            const response = await getMessaging().send(message);
            console.log('Gửi thông báo IoT thành công:', response);
            return res.status(200).json({ success: true, message: 'Đã gửi cảnh báo tới app' });
        } catch (error) {
            console.error('Lỗi khi gửi thông báo:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // Trường hợp dữ liệu an toàn, không vượt ngưỡng
    return res.status(200).json({ success: true, message: 'Dữ liệu bình thường, không cần cảnh báo' });
});

// Chạy server ở cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Node.js đang chạy tại địa chỉ: http://localhost:${PORT}`);
});