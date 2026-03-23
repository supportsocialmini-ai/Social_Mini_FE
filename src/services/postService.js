import axiosClient from '../api/axiosClient';

const postService = {
  getPosts: () => {
    return axiosClient.get('api/post');
  },
  getMyPosts: () => {
    return axiosClient.get('api/post/mypost');
  },
  createPost: (postData) => {
    // postData bao gồm { content, privacy }
    return axiosClient.post('api/post', postData);
  },
  createPostWithImage: (content, privacy, imageFile) => {
    const formData = new FormData();
    formData.append('Content', content);
    formData.append('Privacy', privacy);
    if (imageFile) {
      formData.append('ImageFile', imageFile);
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
  getPostLikes: (postId) => {
    return axiosClient.get(`api/post/${postId}/likes`);
  }
};

export default postService;