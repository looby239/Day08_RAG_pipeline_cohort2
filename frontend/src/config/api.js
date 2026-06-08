export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const API_KEYS_STORAGE_KEY = 'rag_api_keys';

export const getSavedApiKeys = () => {
  try {
    return JSON.parse(localStorage.getItem(API_KEYS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const authHeaders = (keys = getSavedApiKeys()) => {
  const headers = {};

  if (keys.openai) headers['X-OpenAI-Key'] = keys.openai;
  if (keys.qdrant) headers['X-Qdrant-Key'] = keys.qdrant;
  if (keys.deepeval) headers['X-DeepEval-Key'] = keys.deepeval;

  return headers;
};

const parseError = async (response) => {
  try {
    const body = await response.json();
    return body.detail || body.message || response.statusText;
  } catch {
    return response.statusText || 'Unknown API error';
  }
};

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
};

export const chat = ({ query, useHyDE, topK, threshold, searchMode }) => {
  return apiFetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      useHyDE,
      topK: Number(topK),
      threshold: Number(threshold),
      searchMode,
    }),
  });
};

export const retrieve = ({ query, method, topK = 5, threshold = 0.3 }) => {
  return apiFetch('/retrieval', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      method,
      topK: Number(topK),
      threshold: Number(threshold),
    }),
  });
};

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch('/upload', {
    method: 'POST',
    body: formData,
  });
};

export const getEvaluation = () => {
  return apiFetch('/evaluation', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
};
