import { GemniParseResult, AppState } from "../types";
import { supabase } from "./supabaseClient";

// All Gemini calls live in the ai-gateway Supabase Edge Function. The client
// holds no API key -- it only ever calls this one authenticated function.
const callAiGateway = async <T,>(action: string, payload: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('ai-gateway', { body: { action, ...payload } });
  if (error) throw error;
  return data as T;
};

export const parseTransactionInput = async (input: string, context?: string): Promise<GemniParseResult | null> => {
  try {
    return await callAiGateway<GemniParseResult | null>('parseTransaction', { input, context });
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

export const parseMultimodalInput = async (input: string, imageBase64: string, mimeType: string, context?: string): Promise<GemniParseResult | null> => {
  try {
    return await callAiGateway<GemniParseResult | null>('parseMultimodal', { input, imageBase64, mimeType, context });
  } catch (error) {
    console.error("Gemini multimodal parse error:", error);
    return null;
  }
};

export const askAlphaStrategist = async (userMessage: string, appState: AppState): Promise<string> => {
  try {
    const { text } = await callAiGateway<{ text: string }>('askStrategist', { userMessage, appState });
    return text || "Market data unavailable.";
  } catch (error) {
    return "Alpha Strategist is offline.";
  }
};

export interface ReceiptExtraction {
  merchant: string;
  amount: number;
  date: string;
}

export const extractReceiptData = async (imageBase64: string, mimeType: string): Promise<ReceiptExtraction | null> => {
  try {
    return await callAiGateway<ReceiptExtraction | null>('extractReceipt', { imageBase64, mimeType });
  } catch (error) {
    console.error("Receipt extraction error:", error);
    return null;
  }
};

export const getMagicPriorityTasks = async (appState: AppState, language: 'EN' | 'ID'): Promise<string> => {
  try {
    const { text } = await callAiGateway<{ text: string }>('priorityTasks', { appState, language });
    return text || "Unable to formulate strategic roadmap at this moment.";
  } catch (error) {
    console.error("Magic Priority error:", error);
    return "Priority Oracle is busy calculating asset velocity.";
  }
};
