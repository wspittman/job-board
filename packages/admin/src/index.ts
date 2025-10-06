import process from 'node:process';

interface UpdateCompaniesPayload {
  ats: string;
  ids: string[];
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseArgs(argv: string[]): UpdateCompaniesPayload {
  const args = argv.slice(2);
  if (args.length < 2) {
    throw new Error('Usage: npm run update-companies -- <ATS_ID> <COMPANY_ID> [...COMPANY_ID]');
  }

  const [ats, ...ids] = args;
  const normalizedIds = Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));

  if (normalizedIds.length === 0) {
    throw new Error('At least one company ID must be provided.');
  }

  return { ats, ids: normalizedIds };
}

async function updateCompanies(): Promise<void> {
  const { ats, ids } = parseArgs(process.argv);

  const baseUrl = getRequiredEnv('ADMIN_API_BASE_URL');
  const token = getRequiredEnv('ADMIN_API_TOKEN');

  const endpoint = new URL('/api/companies', baseUrl).toString();

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ats, ids })
  });

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  const maybeJson = contentType.includes('application/json') ? safeJsonParse(responseText) : undefined;

  if (!response.ok) {
    const errorMessage = maybeJson ?? (responseText || response.statusText);
    throw new Error(`Request failed with status ${response.status}: ${errorMessage}`);
  }

  if (maybeJson !== undefined) {
    console.log(JSON.stringify(maybeJson, null, 2));
  } else if (responseText.length > 0) {
    console.log(responseText);
  } else {
    console.log(`Request succeeded with status ${response.status}.`);
  }
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    return undefined;
  }
}

updateCompanies().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
