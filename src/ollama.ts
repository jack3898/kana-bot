import { Ollama } from "ollama";
import env from "./env.js";

export const ollama = new Ollama({ host: env.OLLAMA_URL });
