import axiosClient from '../api/axiosClient';

const search = (query, interest = '') => {
  const interestParam = interest ? `&interest=${encodeURIComponent(interest)}` : '';
  return axiosClient.get(`api/search?q=${encodeURIComponent(query)}${interestParam}`);
};

const searchService = { search };
export default searchService;
