// APIクライアントユーティリティ
export const API_HEADERS = {
  'x-auth-token': 'YamashitaKouen-API-2024'
};

export async function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...options?.headers,
    }
  });
}