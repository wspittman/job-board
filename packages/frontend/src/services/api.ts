import axios from "axios";

const API_URL = "http://localhost:3000/api";

export interface Metadata {
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
}

export interface Job {
  id: string;
  companyId: string;
  company: string;
  isRemote: boolean;
  location: string;
  title: string;
  description: string;
  postDate: string;
  applyUrl: string;
}

export interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
}

export const api = axios.create({
  baseURL: API_URL,
});

export const ping = async () => {
  const response = await api.get("/");
  return response.data;
};

export const fetchMetadata = async () => {
  const response = await api.get<Metadata>("/metadata");
  return response.data;
};

export const fetchJobs = async (filters: Filters) => {
  const response = await api.get<Job[]>("/jobs", {
    params: filters,
  });
  return response.data;
};
