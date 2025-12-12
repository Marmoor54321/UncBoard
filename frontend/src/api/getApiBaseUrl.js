export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
}
