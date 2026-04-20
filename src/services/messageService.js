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
  },

  // ==================== GROUP CHAT ====================
  // Tạo nhóm chat mới
  createGroup: (name, memberIds) => {
    return axiosClient.post('api/chat/group', { name, memberIds });
  },
  // Lấy danh sách nhóm của user hiện tại
  getGroups: () => {
    return axiosClient.get('api/chat/groups');
  },
  // Lấy lịch sử tin nhắn của một nhóm
  getGroupMessages: (groupId) => {
    return axiosClient.get(`api/chat/group/${groupId}`);
  },
  // Đánh dấu đã đọc tin nhắn nhóm
  markGroupAsRead: (groupId) => {
    return axiosClient.post(`api/chat/group/${groupId}/read`);
  },
  // Lấy danh sách thành viên của nhóm
  getGroupMembers: (groupId) => {
    return axiosClient.get(`api/chat/group/${groupId}/members`);
  }
};

export default messageService;
