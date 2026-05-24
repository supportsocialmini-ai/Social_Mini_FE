import axiosClient from '../api/axiosClient';

const postService = {
  getPosts: (page = 1, pageSize = 10) => {
    return axiosClient.get(`api/post?page=${page}&pageSize=${pageSize}`);
  },
  getMyPosts: () => {
    return axiosClient.get('api/post/mypost');
  },
  createPost: (postData) => {
    // postData bao gồm { content, privacy, groupId }
    return axiosClient.post('api/post', postData);
  },
  createPostWithImage: (content, privacy, imageFile, groupId) => {
    const formData = new FormData();
    formData.append('Content', content);
    formData.append('Privacy', privacy);
    if (imageFile) {
      formData.append('ImageFile', imageFile);
    }
    if (groupId) {
      formData.append('GroupId', groupId);
    }
    return axiosClient.post('api/image-upload', formData);
  },
  updatePost: (postId, postData) => {
    return axiosClient.put(`api/post/${postId}`, postData);
  },
  deletePost: (postId) => {
    return axiosClient.delete(`api/post/${postId}`);
  },
  getPostsByUserId: (userId) => {
    return axiosClient.get(`api/post/user/${userId}`);
  },
  sharePost: (postId, data) => {
    return axiosClient.post(`api/post/${postId}/share`, data);
  },
  getPostLikes: (postId) => {
    return axiosClient.get(`api/post/${postId}/likes`);
  }
};

export default postService;