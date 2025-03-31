const config = {
    API_BASE_URL: process.env.REACT_APP_BACKEND_URL 
      ? process.env.REACT_APP_BACKEND_URL
      : "https://medimaster-be.vercel.app"
  };
  
  export default config;
  