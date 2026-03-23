import axiosClient from '../api/axiosClient';

const messageService = {
  // Lấy lịch sử tin nhắn với một người dùng cụ thể
  getMessages: (otherUserId) => {
    return axiosClient.get(`api/chat/${otherUserId}`);
  },
  // Đánh dấu đã xem toàn bộ tin nhắn với một người dùng
  markAsRead: (otherUserId) => {
    return axiosClient.post(`api/chat/${otherUserId}/read`);
  },
  // Tải ảnh lên cho mục đích chat
  uploadImage: (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    return axiosClient.post('api/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default messageService;
