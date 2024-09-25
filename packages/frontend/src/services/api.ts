import axios from "axios";

const API_URL = "http://localhost:3000/api";

export interface Job {
  id: string;
  company: string;
  isRemote: boolean;
  location: string;
  title: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

export const api = axios.create({
  baseURL: API_URL,
});

export const ping = async () => {
  const response = await api.get("/");
  return response.data;
};

export const fetchJobs = async (company: string) => {
  const response = await api.get<Job[]>("/jobs", {
    params: {
      company,
    },
  });
  return response.data;
};
