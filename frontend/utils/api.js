const API_BASE_URL = 'http://localhost:3000';

export const parseFiling = async ({ ticker, formType, year }) => {
  const response = await fetch(`${API_BASE_URL}/api/parse-filing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ticker, formType, year }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to parse filing');
  }

  return response.json();
};

export const searchFilings = async ({ query, ticker, year, topK = 5 }) => {
  const response = await fetch(`${API_BASE_URL}/api/search-filings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, ticker, year, topK }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to search filings');
  }

  return response.json();
};