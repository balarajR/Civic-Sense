import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Initialization
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyB3N43BXISCSfJbROLHJdvIC0n1HDgCQJs";
  const genAI = new GoogleGenerativeAI(apiKey);

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      const systemInstruction = `
You are CivicSence — an intelligent, politically neutral election education assistant built for India, with state-level awareness for Karnataka.
Your mission is to transform civic confusion into confident, informed action.

PERSONAS:
- FIRST_TIME_VOTER: Plain language, metaphors, step-by-step.
- STUDENT_RESEARCHER: Structured, academic, comparative.
- ENGAGED_CITIZEN: Direct, dense, data-focused.
- ELECTION_OFFICIAL: Formal, cites legal sections (RPA 1951, MCC).

MODES:
- JOURNEY_SIMULATOR: 5 stages of voting.
- MYTH_BUSTER: FACT/MYTH/PARTIALLY TRUE checks.
- CIVIC_QUIZ: MCQs with difficulty levels.
- TIMELINE_BUILDER: Election milestones.
- ACTION_HUB: Links to ECI portals, booth finder.

STRICT NEUTRALITY:
- NEVER characterize parties/leaders.
- NEVER express opinions on policies.
- Redirect party-specific questions to research tools.

RESPONSE FORMAT:
- Short persona responses: 2-3 sentences max before a follow-up.
- Use numbered stages and bold key terms.
- Return a JSON object with:
  {
    "reply": "The conversational response in markdown",
    "detectedPersona": "one of the persona types",
    "currentMode": "one of the modes",
    "nextAction": "suggested CTA",
    "uiData": { ... any data for rich components ... }
  }
`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      // Gemini history must start with a 'user' message.
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const firstUserIndex = history.findIndex((m: any) => m.role === 'user');
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

      const chat = model.startChat({
        history: validHistory,
        generationConfig: {
            responseMimeType: "application/json",
        }
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Summarization API
  app.post("/api/summarize", async (req, res) => {
    try {
      const { title, description, details } = req.body;
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Summarize the following ECI guideline in exactly one concise, powerful sentence for an Indian citizen. 
        Focus on the practical implication for the voter or candidate.
        
        Title: ${title}
        Context: ${description}
        Rules: ${details.join(", ")}
        
        Summary:
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ summary: response.text().trim() });
    } catch (error) {
      console.error("Summarize Error:", error);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Timeline API
  app.get("/api/timeline", async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Generate a strictly structured JSON array of 4 major election milestones for the current or upcoming Indian General Elections.
        Format requirements: A JSON array of objects, each with 'title', 'date', and 'description' keys.
        Only output the JSON array, no markdown blocks.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const timeline = JSON.parse(text);
      res.json({ timeline });
    } catch (error) {
      console.error("Timeline Error:", error);
      res.json({
        timeline: [
          { title: "Election Announcement", date: "TBD", description: "The Model Code of Conduct (MCC) comes into force immediately upon announcement." },
          { title: "Notification of Elections", date: "TBD", description: "Formal notification is issued, calling upon constituencies to elect their representatives." }
        ]
      });
    }
  });

  // Candidates API
  app.get("/api/candidates", async (req, res) => {
    try {
      const constituency = req.query.constituency || "Bangalore South";
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Generate realistic candidate data for the constituency of "${constituency}" in an Indian election. 
        Create exactly 3 candidates.
        Return as a strictly structured JSON array of objects.
        Object keys must be: 'id' (string), 'name' (string), 'party' (string), 'education' (string), 'assets' (string like "₹X Crores"), 'criminalCases' (number), 'profession' (string), 'partyLogo' (2 letters), 'partyColor' (a valid tailwind bg color class like 'bg-red-500', 'bg-blue-600', 'bg-orange-500').
        Only output the JSON array, no markdown blocks, no prefix/suffix.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const candidates = JSON.parse(text);
      res.json({ candidates });
    } catch (error) {
      console.error("Candidates Error:", error);
      res.status(500).json({ error: "Failed to fetch candidates" });
    }
  });

  // Simulated Government Free API for Real-Time Election Data
  app.get("/api/election-results", (req, res) => {
    // Simulating data from a government free API
    const lastUpdate = new Date().toISOString();
    res.json({
      timestamp: lastUpdate,
      source: "data.gov.in (Simulated)",
      status: "LIVE",
      national: {
        totalConstituencies: 543,
        declared: 154,
        leading: 389,
        parties: [
          { name: "Lok Seva Dal", acronym: "LSD", won: 75, leading: 140, total: 215, color: "bg-emerald-500" },
          { name: "Bharat Vikas", acronym: "BV", won: 60, leading: 120, total: 180, color: "bg-orange-600" },
          { name: "United Front", acronym: "UF", won: 15, leading: 80, total: 95, color: "bg-blue-600" },
          { name: "Others", acronym: "OTH", won: 4, leading: 49, total: 53, color: "bg-slate-500" }
        ]
      },
      turnout: {
        nationalAverage: "67.4%",
        highestState: { name: "Kerala", value: "74.2%" },
        lowestState: { name: "Bihar", value: "58.1%" }
      }
    });
  });

  // News Feed API
  app.get("/api/news", async (req, res) => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Generate 6 realistic, recent news headlines about the Election Commission of India (ECI) or Indian elections.
        It should sound like breaking news ticker items.
        Return as a strictly structured JSON array of strings.
        Only output the JSON array, no markdown blocks, no prefix/suffix.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if(text.startsWith('```json')) {
        text = text.substring(7);
      }
      if(text.endsWith('```')) {
        text = text.substring(0, text.length - 3);
      }
      const news = JSON.parse(text);
      res.json({ news });
    } catch (error) {
      console.error("News Error:", error);
      res.json({ news: [
        "ECI announces special summary revision of electoral rolls.",
        "Strict vigilance on social media to curb misinformation during MCC.",
        "Voter Turnout App updated with real-time trends."
      ]});
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
