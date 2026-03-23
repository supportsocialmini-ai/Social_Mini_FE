import axiosClient from '../api/axiosClient';

const likeService = {
  toggleLike: (postId) => {
    return axiosClient.post(`api/like/${postId}`);
  }
};

export default likeService;
