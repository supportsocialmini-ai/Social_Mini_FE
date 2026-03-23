import axiosClient from '../api/axiosClient';

const notificationService = {
  getNotifications: () => {
    return axiosClient.get('api/notification');
  },
  markAsRead: (notificationId) => {
    return axiosClient.post(`api/notification/${notificationId}/read`);
  },
  markAllAsRead: () => {
    return axiosClient.post('api/notification/read-all');
  }
};

export default notificationService;
