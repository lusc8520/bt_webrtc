export abstract class Env {
  static baseUrl = import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://shuneman.net";

  static wsBaseUrl = import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://shuneman.net/ws";
}
