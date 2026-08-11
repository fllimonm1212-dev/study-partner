import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with higher limit for base64 file payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Helper function to safely parse Gemini JSON responses
  const cleanAndParseJson = (rawText: string) => {
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    }
    return JSON.parse(cleaned);
  };

  // API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Formula & Short Notes Extractor Endpoint
  app.post("/api/gemini/extract-formulas-notes", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets."
        });
      }

      const { fileBase64, mimeType, textInput, subject, additionalInstructions } = req.body;

      if (!fileBase64 && !textInput) {
        return res.status(400).json({ error: "Please provide either a PDF/image file or text input." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `
You are an expert academic tutor for HSC and University Admission (BUET, Medical, Dhaka University) in Bangladesh.
Your task is to analyze the attached document / PDF / study material (Subject: ${subject || "General / All Subjects"}).

Extract all mathematical, physical, chemical, and scientific formulas along with comprehensive short revision notes.
Return ONLY valid JSON matching the following structure:

{
  "docTitle": "A clear descriptive title for this document/chapter in Bengali and English",
  "subject": "${subject || "Science"}",
  "summary": "3-4 sentence concise Bengali summary of the study material",
  "formulas": [
    {
      "chapter": "Chapter / Topic Name",
      "name": "Formula Name (e.g. মহাকর্ষীয় বল / Coulomb's Law)",
      "formula": "The exact formula (e.g., F = G * (m1 * m2) / r^2 or E = mc^2)",
      "variables": "Detailed explanation of each variable in Bengali (e.g., F = আকর্ষণ বল (N), G = মহাকর্ষীয় ধ্রুবক (6.673×10^-11 N m^2/kg^2), m1, m2 = ভর (kg), r = দূরত্ব (m))",
      "units": "SI Units / Constants involved",
      "shortTip": "Shortcut application tip or exam trick for solving math quickly"
    }
  ],
  "shortNotes": [
    {
      "topic": "Topic / Concept Title",
      "keyPoints": [
        "Key point 1 in clear Bengali",
        "Key point 2 in clear Bengali",
        "Key point 3 in clear Bengali"
      ],
      "importantDefinitions": [
        "Definition or Law statement in Bengali"
      ],
      "examWarnings": [
        "Common mistake to avoid in HSC / Admission exam"
      ]
    }
  ],
  "mcqTricks": [
    "Quick shortcut trick for MCQ questions in 10 seconds"
  ]
}

Instructions:
1. Make sure to capture EVERY formula in the document. Do not miss any equation or formula!
2. Write all explanations, variable descriptions, and notes in clear, easy-to-understand Bengali (বাংলা).
3. Keep the math symbols clean and standard.
4. ${additionalInstructions ? `User additional preference: ${additionalInstructions}` : "Focus on high-yield HSC & Admission exam topics."}
`;

      const contentsParts: any[] = [];

      if (fileBase64 && mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64,
          },
        });
      }

      if (textInput) {
        contentsParts.push({
          text: `Extracted text content from study material:\n${textInput}`,
        });
      }

      contentsParts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: contentsParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              docTitle: { type: Type.STRING },
              subject: { type: Type.STRING },
              summary: { type: Type.STRING },
              formulas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    chapter: { type: Type.STRING },
                    name: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    variables: { type: Type.STRING },
                    units: { type: Type.STRING },
                    shortTip: { type: Type.STRING },
                  },
                },
              },
              shortNotes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    importantDefinitions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    examWarnings: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                },
              },
              mcqTricks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const jsonText = response.text || "{}";
      const parsedData = cleanAndParseJson(jsonText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Gemini formula extraction error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze document with AI. Please try again.",
      });
    }
  });

  // AI MCQ Question Generator Endpoint from PDF / Text
  app.post("/api/gemini/generate-questions-from-pdf", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY environment variable is missing. Please configure it in Settings > Secrets."
        });
      }

      const { fileBase64, mimeType, textInput, subject, questionCount, difficulty } = req.body;

      if (!fileBase64 && !textInput) {
        return res.status(400).json({
          success: false,
          error: "Please provide either a PDF/image file or text input."
        });
      }

      const count = Math.min(Math.max(parseInt(questionCount) || 10, 5), 20);

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `
You are an expert HSC and University Admission (BUET, Medical, Dhaka University) exam question creator in Bangladesh.
Your task is to generate ${count} high-quality Multiple Choice Questions (MCQs) directly from the provided study material / PDF (Subject: ${subject || "General Science"}, Difficulty: ${difficulty || "Standard Admission Level"}).

Return ONLY valid JSON matching the following structure:

{
  "docTitle": "A catchy title for this generated PDF exam",
  "subject": "${subject || "Science"}",
  "totalQuestions": ${count},
  "questions": [
    {
      "id": 1,
      "question": "Clear MCQ Question text in Bengali (বাংলা)",
      "options": [
        "Option A in Bengali/English",
        "Option B in Bengali/English",
        "Option C in Bengali/English",
        "Option D in Bengali/English"
      ],
      "correctOptionIndex": 0,
      "explanation": "Detailed step-by-step solution / explanation in Bengali for why option 1 is correct and how to solve it",
      "chapter": "Topic / Chapter Name"
    }
  ]
}

Instructions:
1. Generate EXACTLY ${count} unique questions covering key concepts, formulas, and math problems in the text/PDF.
2. Ensure correctOptionIndex is an integer from 0 to 3 corresponding to the correct option in the options array.
3. Provide rich, clear Bengali explanations for every question so students learn from their mistakes.
4. Keep options plausible and clean without any prefix like A), B), C), D).
`;

      const contentsParts: any[] = [];

      if (fileBase64 && mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: fileBase64,
          },
        });
      }

      if (textInput) {
        contentsParts.push({
          text: `Extracted text content from study material:\n${textInput}`,
        });
      }

      contentsParts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: contentsParts },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              docTitle: { type: Type.STRING },
              subject: { type: Type.STRING },
              totalQuestions: { type: Type.INTEGER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctOptionIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    chapter: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const jsonText = response.text || "{}";
      const parsedData = cleanAndParseJson(jsonText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Gemini MCQ generation error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate MCQ questions with AI. Please try again.",
      });
    }
  });

  // Global Express Error Handler Middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Global Express Error Handler caught:", err);
    if (err?.type === "entity.too.large" || err?.status === 413) {
      return res.status(413).json({
        success: false,
        error: "ফাইলের আকার খুব বড় (Payload Too Large)। ১০ মেগাবাইটের কম সাইজের PDF বা স্টাডি টেক্সট আপলোড করুন।"
      });
    }
    return res.status(500).json({
      success: false,
      error: err?.message || "সার্ভারে একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন।"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
