import axiosClient from '../api/axiosClient';

const groupService = {
  createGroup: (groupData) => {
    return axiosClient.post('/api/group/create', groupData);
  },

  getMyGroups: () => {
    return axiosClient.get('/api/group/my-groups');
  },

  getGroupById: (groupId) => {
    return axiosClient.get(`/api/group/${groupId}`);
  },

  searchGroups: (query) => {
    return axiosClient.get(`/api/group/search?query=${query}`);
  },

  joinGroup: (groupId) => {
    return axiosClient.post(`/api/group/${groupId}/join`);
  },

  leaveGroup: (groupId) => {
    return axiosClient.post(`/api/group/${groupId}/leave`);
  },

  getGroupMembers: (groupId) => {
    return axiosClient.get(`/api/group/${groupId}/members`);
  },

  getGroupPosts: (groupId) => {
    return axiosClient.get(`/api/post/group/${groupId}`);
  },

  getConversationId: (groupId) => {
    return axiosClient.get(`/api/group/${groupId}/conversation`);
  },

  getSuggestedGroups: () => {
    return axiosClient.get('/api/group/suggested');
  },

  removeMember: (groupId, userId) => {
    return axiosClient.delete(`/api/group/${groupId}/members/${userId}/remove`);
  },

  inviteToGroup: (groupId, friendId) => {
    return axiosClient.post(`/api/group/${groupId}/members/${friendId}/invite`);
  },

  getTopicUsers: (groupId) => {
    return axiosClient.get(`/api/group/${groupId}/topic-users`);
  }
};

export default groupService;
