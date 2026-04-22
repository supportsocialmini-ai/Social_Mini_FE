import axiosClient from '../api/axiosClient';

const adminService = {
  getStats: () => {
    return axiosClient.get('api/admin/stats');
  },
  getUsers: () => {
    return axiosClient.get('api/admin/users');
  },
  getMaintenanceStatus: () => {
    return axiosClient.get('api/admin/maintenance-status');
  },
  toggleMaintenance: () => {
    return axiosClient.post('api/admin/toggle-maintenance');
  },
  toggleUserStatus: (userId) => {
    return axiosClient.post(`api/admin/users/${userId}/toggle-status`);
  },
  deletePost: (postId) => {
    return axiosClient.delete(`api/admin/posts/${postId}`);
  },
  getPackages: () => {
    return axiosClient.get('api/admin/packages');
  },
  updatePackage: (id, data) => {
    return axiosClient.put(`api/admin/packages/${id}`, data);
  },
  createPackage: (data) => {
    return axiosClient.post('api/admin/packages', data);
  }
};

export default adminService;
