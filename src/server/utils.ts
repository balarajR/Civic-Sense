export function sanitizeInput(input: string): string {
  return input
    .replace(/ignore (?:all )?(?:previous|above|all) instructions/gi, "[removed]")
    .replace(/system prompt/gi, "[removed]")
    .slice(0, 2000);
}

export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    console.warn("JSON parse failed for AI output, using fallback.");
    return fallback;
  }
}

export interface LocalElectionAnswer {
  reply: string;
  detectedPersona: string;
  currentMode: string;
  nextAction: string;
  uiData: Record<string, unknown>;
}

const officialLinks = [
  "- Voter registration/status: https://voters.eci.gov.in",
  "- Electoral roll search: https://electoralsearch.eci.gov.in",
  "- Voter Helpline App: https://eci.gov.in/voter/voter-helpline-app",
  "- Results portal: https://results.eci.gov.in",
];

export function buildLocalElectionAnswer(rawInput: string): LocalElectionAnswer {
  const input = rawInput.toLowerCase();
  const isTimeline = /\b(date|timeline|schedule|phase|counting|mcc|notification)\b/.test(input);
  const isBooth = /\b(booth|polling station|where.*vote|location)\b/.test(input);
  const isRegistration = /\b(register|registration|form 6|new voter|name.*roll|voter id|epic)\b/.test(input);
  const isMyth = /\b(fake|myth|rumou?r|evm|vvpat|nota|fraud)\b/.test(input);

  if (isTimeline) {
    return {
      reply: [
        "Here is the election timeline in a simple path:",
        "",
        "1. **Announcement:** ECI declares the election schedule and the Model Code of Conduct starts.",
        "2. **Notification:** Nominations open for each constituency.",
        "3. **Nomination scrutiny and withdrawal:** Candidate papers are checked, then the final candidate list is published.",
        "4. **Campaign and silence period:** Campaigning runs until the silence period before polling.",
        "5. **Polling day:** Voters verify identity, vote on EVM, and check the VVPAT slip.",
        "6. **Counting and results:** Counting happens on the announced date and results appear on the official ECI portal.",
        "",
        "**Always verify exact dates on ECI or your state CEO website because schedules can change by constituency.**",
        "",
        officialLinks.join("\n"),
      ].join("\n"),
      detectedPersona: "FIRST_TIME_VOTER",
      currentMode: "TIMELINE_BUILDER",
      nextAction: "Open the Timeline tool and verify dates on the ECI portal.",
      uiData: {
        events: [
          { title: "Schedule Announcement", date: "ECI announced", description: "MCC begins immediately after the official schedule is announced." },
          { title: "Nomination Window", date: "As notified", description: "Candidates submit nomination papers for each constituency." },
          { title: "Polling Day", date: "Phase-wise", description: "Voters cast votes at assigned polling stations." },
          { title: "Counting Day", date: "ECI announced", description: "Votes are counted and results are published officially." },
        ],
      },
    };
  }

  if (isBooth) {
    return {
      reply: [
        "To find your polling booth:",
        "",
        "1. Keep your EPIC number or registered details ready.",
        "2. Search your name on the electoral roll.",
        "3. Note the polling station name, part number, and serial number.",
        "4. Carry your EPIC card or another ECI-approved photo ID on polling day.",
        "",
        officialLinks.slice(0, 3).join("\n"),
      ].join("\n"),
      detectedPersona: "FIRST_TIME_VOTER",
      currentMode: "ACTION_HUB",
      nextAction: "Use the Booth Finder inside Action Hub.",
      uiData: {},
    };
  }

  if (isRegistration) {
    return {
      reply: [
        "For voter registration, follow this checklist:",
        "",
        "1. Confirm you are 18 or older on the qualifying date.",
        "2. Submit **Form 6** on voters.eci.gov.in or through the Voter Helpline App.",
        "3. Upload proof of age, address, and a photo.",
        "4. Track the application status online.",
        "5. After approval, confirm your name appears in the electoral roll.",
        "",
        officialLinks.slice(0, 3).join("\n"),
      ].join("\n"),
      detectedPersona: "FIRST_TIME_VOTER",
      currentMode: "JOURNEY_SIMULATOR",
      nextAction: "Start the Journey tool from registration step one.",
      uiData: {},
    };
  }

  if (isMyth) {
    return {
      reply: [
        "**Neutral myth-check approach:** I can help classify an election claim as fact, myth, or partly true.",
        "",
        "Share the exact claim, source, date, and place. I will compare it against official ECI material, court/legal context where relevant, and credible public records without favoring any party or candidate.",
      ].join("\n"),
      detectedPersona: "ENGAGED_CITIZEN",
      currentMode: "MYTH_BUSTER",
      nextAction: "Paste the exact claim you want checked.",
      uiData: {},
    };
  }

  return {
    reply: [
      "I can guide you through the Indian election process step by step.",
      "",
      "**Best starting points:** registration, voter ID/EPIC, booth lookup, polling-day process, election timeline, Model Code of Conduct, or results.",
      "",
      officialLinks.join("\n"),
    ].join("\n"),
    detectedPersona: "UNKNOWN",
    currentMode: "GENERAL",
    nextAction: "Ask about registration, election timelines, booth lookup, or voting day steps.",
    uiData: {},
  };
}
