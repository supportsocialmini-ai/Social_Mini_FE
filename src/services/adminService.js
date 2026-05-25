import axiosClient from '../api/axiosClient';

const adminService = {
  getStats: () => {
    return axiosClient.get('api/admin/stats');
  },
  getUsers: (page = 1, pageSize = 10, searchTerm = '') => {
    return axiosClient.get(`api/admin/users?page=${page}&pageSize=${pageSize}&searchTerm=${encodeURIComponent(searchTerm)}`);
  },
  getMaintenanceStatus: () => {
    return axiosClient.get('api/admin/maintenance-status');
  },
  toggleMaintenance: () => {
    return axiosClient.post('api/admin/toggle-maintenance');
  },
  getMaintenanceInfo: () => {
    return axiosClient.get('api/admin/maintenance-info');
  },
  saveMaintenanceInfo: (data) => {
    return axiosClient.post('api/admin/maintenance-info', data);
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
  },
  getGroups: () => {
    return axiosClient.get('api/admin/groups');
  },
  deleteGroup: (groupId) => {
    return axiosClient.delete(`api/admin/groups/${groupId}`);
  },
  getDetailedStats: (startDate = '', endDate = '') => {
    return axiosClient.get(`api/admin/detailed-stats?startDate=${startDate}&endDate=${endDate}`);
  }
};

export default adminService;
