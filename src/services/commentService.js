import axiosClient from '../api/axiosClient';

const commentService = {
  getComments: (postId) => {
    return axiosClient.get(`api/comment/post/${postId}`);
  },
  createComment: (commentData) => {
    // commentData bao gồm { postId, content }
    return axiosClient.post('api/comment', commentData);
  },
  deleteComment: (commentId) => {
    return axiosClient.delete(`api/comment/${commentId}`);
  }
};

export default commentService;
