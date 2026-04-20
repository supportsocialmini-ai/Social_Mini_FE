import axiosClient from '../api/axiosClient';

const adminService = {
  getStats: () => {
    return axiosClient.get('api/admin/stats');
  },
  getUsers: () => {
    return axiosClient.get('api/admin/users');
  },
  toggleUserStatus: (userId) => {
    return axiosClient.post(`api/admin/users/${userId}/toggle-status`);
  },
  deletePost: (postId) => {
    return axiosClient.delete(`api/admin/posts/${postId}`);
  }
};

export default adminService;
