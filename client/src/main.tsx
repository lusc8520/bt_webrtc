import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./css/main.css";
import "./binaryMessage.ts";

createRoot(document.getElementById("root")!).render(<App />);
