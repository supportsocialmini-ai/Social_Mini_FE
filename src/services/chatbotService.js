import axiosClient from '../api/axiosClient';

const chatbotService = {
  askBot: async (message, history) => {
    const response = await axiosClient.post('api/ChatBot/ask', { message, history });
    return response; // response here is already the data due to interceptor
  }
};

export default chatbotService;
