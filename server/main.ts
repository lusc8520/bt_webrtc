import { WebSocketServer } from "ws";
import express from "express";
import { Client } from "./types";
import { ClientMessage } from "../contract/sharedTypes";

// boilerplate for setting up http server with websocket server ...
const expressApp = express();
const httpServer = expressApp.listen(8080, () => {
  console.log("Express server listening on 8080");
});
const websocketServer = new WebSocketServer({ server: httpServer });

// storage for managing clients
const connectedClients = new Map<number, Client>();
let clientIdCounter = 0;

// websocket logic
websocketServer.on("connection", (websocket) => {
  const clientId = clientIdCounter;
  clientIdCounter++;

  const client = new Client(clientId, websocket);

  websocket.onerror = () => {
    websocket.close();
  };
  websocket.onclose = () => {
    connectedClients.delete(clientId);
  };

  websocket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data as string) as ClientMessage;
      connectedClients
        .get(message.clientId)
        ?.sendMessage({ ...message, clientId: client.id });
    } catch {
      websocket.close();
    }
  };

  client.sendMessage({ pType: "joined", ids: [...connectedClients.keys()] });

  connectedClients.set(clientId, client);
});
