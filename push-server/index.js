const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const cors = require('cors');

// Khởi tạo Firebase Admin SDK với file khóa bảo mật
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const app = express();
app.use(express.json());
app.use(cors());

// Định nghĩa API endpoint kiểu POST để gửi thông báo đẩy
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

// Chạy server ở cổng 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Node.js đang chạy tại địa chỉ: http://localhost:${PORT}`);
});