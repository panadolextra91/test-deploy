const config = {
    API_BASE_URL: process.env.REACT_APP_BACKEND_URL 
      ? process.env.REACT_APP_BACKEND_URL
      : "https://medimaster-be.vercel.app",
    // Add a helper to check if we're in development
    isDevelopment: process.env.NODE_ENV === 'development'
};

export default config;
  