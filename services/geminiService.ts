import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeScreenshot = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Remove header if present to get pure base64
    const cleanBase64 = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: `Analyze this screenshot deeply. 
            1. If it contains code, extract the main logic into a code block.
            2. If it contains text, provide a concise summary.
            3. If it's a UI, describe the layout and key elements.
            
            Return the response in JSON format with keys: 'summary', 'code' (optional), 'text' (extracted visible text).`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { summary: "No analysis generated." };

    try {
      const json = JSON.parse(text);
      return {
        summary: json.summary || json.description,
        code: json.code,
        text: json.text
      };
    } catch (e) {
      // Fallback if JSON parsing fails (though responseMimeType should prevent this)
      return { summary: text };
    }

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    throw error;
  }
};
