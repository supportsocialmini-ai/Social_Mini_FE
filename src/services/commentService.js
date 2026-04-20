import axiosClient from '../api/axiosClient';

const commentService = {
  getComments: (postId) => {
    return axiosClient.get(`api/comment/post/${postId}`);
  },
  createComment: (commentData) => {
    return axiosClient.post('api/comment', commentData);
  },
  createReply: (replyData) => {
    // replyData bao gồm { commentId, content }
    return axiosClient.post('api/comment/reply', replyData);
  },
  deleteComment: (commentId) => {
    return axiosClient.delete(`api/comment/${commentId}`);
  },
  deleteReply: (replyId) => {
    return axiosClient.delete(`api/comment/reply/${replyId}`);
  }
};


export default commentService;
