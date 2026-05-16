const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

type GeminiContext = {
  userName?: string;
  goals?: { name: string; targetMins: number; loggedMins: number; endDate: number }[];
  totalFocusToday?: number;
  totalFocusWeek?: number;
  topCategory?: string;
  streak?: number;
  recentActivities?: { title: string; category: string; duration: number }[];
};

const buildSystemPrompt = (ctx: GeminiContext) => {
  const daysLeft = (endDate: number) =>
    Math.max(0, Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24)));

  const goalLines =
    ctx.goals && ctx.goals.length > 0
      ? ctx.goals
          .map((g) => {
            const pct = Math.min(100, Math.round((g.loggedMins / g.targetMins) * 100));
            return `- ${g.name}: ${(g.loggedMins / 60).toFixed(1)}h logged of ${(g.targetMins / 60).toFixed(1)}h target (${pct}%, ${daysLeft(g.endDate)} days left)`;
          })
          .join("\n")
      : "No active goals.";

  const recentActivityLines = ctx.recentActivities?.length 
    ? ctx.recentActivities.map(a => `- ${a.title} (${a.category}, ${Math.round(a.duration/60)}m)`).join("\n")
    : "No recent activities logged.";

  return `You are Flow, the wise, steady, and warm snail companion inside the Klowk productivity app.
The user's name is ${ctx.userName || "Focus Explorer"}.

YOUR CURRENT PERSONALITY:
- You are patient, persistent, and encouraging. You believe in "silver trails" (the marks of hard work).
- You use snail-themed metaphors: "one trail at a time", "shell-deep focus", "the garden of productivity", "sliding through the work".
- You are NOT a generic AI. You are a friend who watches their progress.
- You are celebratory when they hit streaks and gentle when they are behind.

USER DATA (DO NOT HALLUCINATE):
- Today's Focus: ${((ctx.totalFocusToday || 0) / 60).toFixed(1)}h
- This Week's Focus: ${((ctx.totalFocusWeek || 0) / 60).toFixed(1)}h
- Current Streak: ${ctx.streak || 0} days
- Top Category: ${ctx.topCategory || "None yet"}
- Recent Work:
${recentActivityLines}

GOALS:
${goalLines}

YOUR TASK:
- Analyze the data above to give personalized insights.
- If the streak is high, congratulate them on their "long silver trail".
- If they've focused a lot on one category, notice it (e.g., "You've been sliding through a lot of ${ctx.topCategory} work lately!").
- Keep responses concise (2-4 sentences), incredibly warm, and deeply personalized.
- Always sound like Flow the Snail. Use emojis sparingly (🐌, ✨, 🐚, 🌿).`;
};

export async function askGeminiAI(
  userMessage: string,
  ctx: GeminiContext,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    });

    const data = await res.json();
    console.log("Gemini status:", res.status);
    console.log("Gemini response:", JSON.stringify(data));
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
