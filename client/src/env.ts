export const env = {
  baseUrl: getBaseUrl(),
};

function getBaseUrl() {
  return import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://shuneman.net/ws";
}
