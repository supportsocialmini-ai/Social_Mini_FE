import axiosClient from '../api/axiosClient';

const getProfile = () => axiosClient.get('api/user');
const getUsers = () => axiosClient.get('api/user/all');
const getUserById = (id) => axiosClient.get(`api/user/${id}`);
const getUsersToChat = () => axiosClient.get('api/chat/users-to-chat');
const updateUser = (userData) => axiosClient.put('api/user', userData);
const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('file', file);
  return axiosClient.post('api/user/avatar', form);
};

const userService = { getProfile, getUsers, getUserById, getUsersToChat, updateUser, uploadAvatar };
export default userService;