import axiosClient from '../api/axiosClient';

const search = (query, category = '') => {
  const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
  return axiosClient.get(`api/search?q=${encodeURIComponent(query)}${categoryParam}`);
};

const searchService = { search };
export default searchService;
