import axiosClient from '../api/axiosClient';

const reportService = {
  createReport: (reportData) => {
    return axiosClient.post('api/Report', reportData);
  },
  
  // Dành cho Admin
  getAllReports: () => {
    return axiosClient.get('api/Report/admin/list');
  },
  
  resolveReport: (reportId, action) => {
    return axiosClient.post(`api/Report/admin/resolve/${reportId}?action=${action}`);
  }
};

export default reportService;
