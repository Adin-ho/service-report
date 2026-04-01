import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL;

if (!apiBaseURL) {
  throw new Error("VITE_API_URL is not defined. Please set it in your frontend .env file.");
}

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

let redirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const url = error.config?.url || "";
      // Jangan redirect saat sudah di halaman login atau saat memanggil /auth/me di background.
      const isAuthCheck = url.includes("/auth/me") || path.startsWith("/login");
      if (!isAuthCheck && !redirecting) {
        redirecting = true;
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
