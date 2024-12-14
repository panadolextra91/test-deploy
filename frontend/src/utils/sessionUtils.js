// utils/sessionUtils.js
export const getSessionData = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const role = localStorage.getItem("userRole") || sessionStorage.getItem("userRole");

    console.log("Retrieved token:", token); // Debug log
    console.log("Retrieved role:", role);   // Debug log

    return { token, role };
};
