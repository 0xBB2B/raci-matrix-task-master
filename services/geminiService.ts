import { GoogleGenAI, Type } from "@google/genai";
import { ProjectSuggestion } from "../types";

const createClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY is missing from environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
}

export const generateRaciPlan = async (goal: string): Promise<ProjectSuggestion[]> => {
    const ai = createClient();
    if (!ai) return [];

    const prompt = `
    You are a project management expert specializing in the RACI matrix (Responsible, Accountable, Consulted, Informed).
    Break down the following project goal into a list of specific, actionable tasks.
    For each task, assign hypothetical RACI roles (using generic job titles or 'Team').
    
    Project Goal: "${goal}"

    Ensure the output contains at least 3-5 tasks.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            roles: {
                                type: Type.OBJECT,
                                properties: {
                                    responsible: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    accountable: { type: Type.STRING },
                                    consulted: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    informed: { type: Type.ARRAY, items: { type: Type.STRING } },
                                },
                                required: ["responsible", "accountable", "consulted", "informed"]
                            }
                        },
                        required: ["title", "description", "roles"]
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as ProjectSuggestion[];
    } catch (error) {
        console.error("Failed to generate RACI plan:", error);
        return [];
    }
}
