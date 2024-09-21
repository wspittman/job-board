import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
});

export const ping = async () => {
  const response = await api.get("/");
  return response.data;
};
