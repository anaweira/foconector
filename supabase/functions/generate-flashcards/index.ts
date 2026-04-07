import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function geminiJSON(system: string, user: string, key: string): Promise<any> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
    }),
  });
  if (!r.ok) throw new Error(`Gemini error: ${r.status}`);
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SERVICE_ROLE_KEY")!);
  const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
  try {
    const { note_id } = await req.json();
    const { data: note } = await supabase.from("study_notes").select("*").eq("id", note_id).single();
    if (!note) throw new Error("Note not found");

    const system = `Você é especialista em elaboração de questões para concursos e ENEM brasileiros.
Gere entre 15 a 25 flashcards cobrindo 100% do conteúdo do apunte.
Use os 6 tipos: DIRETA, MULTIPLOS ITENS (I/II/III), ALTERNATIVA INCORRETA, CASO CONCRETO, CONCEITUAL, JURISPRUDENCIA/TECNICA.
REGRAS:
- Cada flashcard: 5 alternativas SEM letras (sem A B C D E), apenas 1 correta
- Alternativas densas e técnicas, todas plausíveis
- Erros sutis: conceito invertido, exceção ignorada, termo trocado
- NUNCA use travessões
- Responda APENAS com JSON válido no formato especificado`;

    const user = `Com base no apunte abaixo, gere flashcards cobrindo TODO o conteúdo.
Retorne JSON: { "flashcards": [{ "question": "...", "alternatives": [{"text":"...","correct":false},{"text":"...","correct":true},...], "correct_answer": "...", "explanation": "..." }] }

APUNTE:
${(note.content || note.title).substring(0, 30000)}`;

    const parsed = await geminiJSON(system, user, geminiKey);
    const cards = (parsed.flashcards || []).map((fc: any) => ({
      study_note_id: note_id,
      user_id: note.user_id,
      front: fc.question,
      back: fc.correct_answer + (fc.explanation ? `\n\n${fc.explanation}` : ""),
      alternatives: fc.alternatives,
    }));

    if (cards.length > 0) await supabase.from("flashcards").insert(cards);
    return new Response(JSON.stringify({ success: true, count: cards.length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
