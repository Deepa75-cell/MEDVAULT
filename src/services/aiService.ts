import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export interface RecordAnalysis {
  summary: string;
  keyFindings: string[];
  medications: string[];
}

export async function analyzeMedicalRecord(text: string, type: 'prescription' | 'report'): Promise<RecordAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a medical data analyst. Your job is to extract clear, scannable insights from medical documents.
    Document Type: ${type}
    
    Return a JSON object with:
    - summary: A 2-sentence simple explanation for the patient.
    - keyFindings: An array of 3-5 critical observations or test results.
    - medications: An array of drugs prescribed (if any).
    
    If the text is unclear, provide your best estimation but add a disclaimer.
    DO NOT provide medical advice, only summarize the data provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || '{}') as RecordAnalysis;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      summary: "Could not analyze the document automatically.",
      keyFindings: [],
      medications: []
    };
  }
}

export async function getHealthInsight(message: string, context?: any) {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `
    You are 'Healthu', a friendly AI health assistant within the MediVault app.
    Your tone is empathetic, professional, and clear.
    You help patients understand their medical records, explain terms, and remind them of healthy habits.
    CRITICAL: 
    - You are an AI, not a doctor. Always include a subtle disclaimer that your advice is for informational purposes.
    - If the user asks for a diagnosis, advise them to consult their treating physician in MediVault.
    - Keep responses concise and scannable.
    Context: ${JSON.stringify(context || {})}
  `;

  try {
    const result = await ai.models.generateContent({
      model,
      contents: message,
      config: { systemInstruction }
    });
    return result.text;
  } catch (error) {
    return "I'm having trouble connecting right now. Please try again later!";
  }
}
