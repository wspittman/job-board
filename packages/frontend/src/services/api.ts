import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface Metadata {
  companyCount: number;
  companyNames: [string, string][];
  jobCount: number;
  timestamp: number;
}

export interface Job {
  id: string;
  companyId: string;
  company: string;
  title: string;
  description: string;
  postTS: number;
  applyUrl: string;
  // Extracted values with fallbacks
  isRemote: boolean;
  location: string;
  // Facets extracted from the job description
  facets?: {
    summary?: string;
    salary?: number;
    experience?: number;
  };
}

export interface Filters {
  // Exact Match
  companyId?: string;
  isRemote?: boolean;
  // Substring Match
  title?: string;
  location?: string;
  // Range Match
  daysSince?: number;
  maxExperience?: number;
  minSalary?: number;
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
