import axiosClient from '../api/axiosClient';

const friendService = {
    sendRequest: (userId) => {
        return axiosClient.post(`api/friend/request/${userId}`);
    },
    acceptRequest: (requestId) => {
        return axiosClient.post(`api/friend/accept/${requestId}`);
    },
    declineRequest: (requestId) => {
        return axiosClient.post(`api/friend/decline/${requestId}`);
    },
    unfriend: (friendId) => {
        return axiosClient.delete(`api/friend/unfriend/${friendId}`);
    },
    cancelRequest: (requestId) => {
        return axiosClient.delete(`api/friend/cancel/${requestId}`);
    },
    getFriends: () => {
        return axiosClient.get('api/friend/list');
    },
    getPendingRequests: () => {
        return axiosClient.get('api/friend/pending');
    },
    getFriendshipStatus: (userId) => {
        return axiosClient.get(`api/friend/status/${userId}`);
    }
};

export default friendService;
