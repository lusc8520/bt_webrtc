const isDev = import.meta.env.DEV;

export abstract class Env {
  static baseUrl = isDev ? "http://localhost:3000" : "https://shuneman.net";

  static wsBaseUrl = isDev
    ? "http://localhost:3000"
    : "https://shuneman.net/ws";
}
