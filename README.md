# Job Board

Caution: This project is in the early stages of development. It is not yet ready for production use. This README is likely out of date.

## Problem Statement

Traditional job boards face significant challenges in providing an efficient and effective platform for job seekers:

1. **Misaligned Incentives**: Job boards prioritize employer needs over job seeker experience due to their revenue model. This inevitably leads to feature bloat, poor user experience for job seekers, and escalating operational costs.
2. **Data Difficulties**: Job information in Applicant Tracking Systems (ATS) lack rich metadata. This makes it prohibitively expensive for job boards to provide more than basic search and filtering capabilities, which in turn leads to difficulty in matching candidates to relevant positions and an inefficient job discovery process.

## The LLM Opportunity

Large Language Models (LLMs) offer a transformative solution to these long-standing issues:

1. **Lean Development**: LLM-assisted development enables smaller teams to build sophisticated platforms, which in turn reduces operational costs significantly. This changes the economics, allowing for a job board that focuses squarely on the job seeker.
2. **Enhanced Data Processing**: LLMs can extract rich metadata from unstructured job descriptions. This enables advanced search and filtering possibilities, both using traditional methods and based on semantic understanding.

## Project Goal

Our aim is to create a next-generation job board that prioritizes the job seeker's experience while maintaining operational efficiency. By addressing the core issues of traditional platforms, we seek to transform how people discover and apply for jobs.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Azure CosmosDB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator) or [Azure CosmosDB Account](https://azure.microsoft.com/en-us/services/cosmos-db/)

#### Local CosmosDB Emulator

CosmosDB has a local emulator that you can use for development. These instructions have been used on a direct-install emulator on Windows 10. A similar process should work on other versions of Windows or using the Docker-hosted emulator.

- Install the [Azure CosmosDB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-develop-emulator)
- Export the Azure CosmosDB Emulator certificate
  - Open the Windows Certificate Manager
  - Navigate to `Trusted Root Certification Authorities` > `Certificates`
  - Find the certificate for Issued To: `localhost`, Friendly Name: `DocumentDbEmulatorCertificate`
  - Right-click the certificate and select `All Tasks` > `Export...`
  - No, do not export the private key
  - Base-64 encoded X.509 (.CER)
  - Save the file to `packages\backend\cosmosdbcert.cer`

### Running

Install dependencies:

```bash
npm install
```

Run backend and frontend services:

```bash
npm run start:backend
npm run start:frontend
```

## In-Progress Screenshot

A screenshot of the current UI. We have a ways to go.

![An in-progress screenshot from 9/30/24](screenshots/InProgress_9_30_24.png)

## API Reference

### `GET /`

Health check. Verify the API is running.

**Response:** Plain text `"API is working"`

### `GET /metadata`

Retrieve metadata about the job board, including company and job counts.

**Response**

```json
{
  "id": "metadata",
  "companyCount": 123,
  "companyNames": [
    ["company1_id", "Company 1 Name"],
    ["company2_id", "Company 2 Name"]
  ],
  "jobCount": 456
}
```

### `GET /jobs`

Retrieve jobs based on specified filters.

**Query Parameters:**

- `companyId` (optional): Filter by company ID
- `isRemote` (optional): Filter by remote status (true/false)
- `title` (optional): Filter by job title (substring match)
- `location` (optional): Filter by job location (substring match)

**Response**

```json
[
  {
    "id": "job123",
    "companyId": "company1",
    "company": "Company 1 Name",
    "title": "Software Engineer",
    "isRemote": true,
    "location": "New York, NY",
    "description": "Job description here...",
    "postDate": "2023-09-27",
    "applyUrl": "https://example.com/apply/job123"
  }
]
```

**Note:** If no filters are provided, an empty array will be returned.

### `POST /jobs`

Trigger a job crawl and metadata renewal

**Response:** Plain text `"Success"`

### `PUT /company`

Add a new company to the job board.

**Request Body:**

```json
{
  "id": "company_id",
  "ats": "ATS_NAME"
}
```

**Response:** Plain text `"Success"`
