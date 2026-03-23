import axiosClient from '../api/axiosClient';

const search = (query) => axiosClient.get(`api/search?q=${encodeURIComponent(query)}`);

const searchService = { search };
export default searchService;
