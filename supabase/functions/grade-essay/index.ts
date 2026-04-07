import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function geminiJSON(system: string, user: string, key: string): Promise<any> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, responseMimeType: "application/json" },
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
    const { essay_id } = await req.json();
    const { data: essay } = await supabase.from("essays").select("*").eq("id", essay_id).single();
    if (!essay) throw new Error("Essay not found");

    const system = `Você é corretor experiente de redações do ENEM, treinado nas 5 competências do INEP:
C1: Domínio da modalidade escrita formal (0-200)
C2: Compreender a proposta e aplicar conceitos (0-200)
C3: Selecionar, relacionar e interpretar informações (0-200)
C4: Conhecimento dos mecanismos linguísticos (0-200)
C5: Proposta de intervenção social respeitando direitos humanos (0-200)
Notas em múltiplos de 40. Avalie com rigor mas construtivamente. Responda APENAS JSON.`;

    const user = `Tema: ${essay.theme}\nRedação:\n${essay.content}
Retorne JSON: { "score": { "total": 0, "competencies": [{"name":"C1 - ...","score":0,"feedback":"..."},...] }, "feedback": "feedback geral em markdown" }`;

    const parsed = await geminiJSON(system, user, geminiKey);
    await supabase.from("essays").update({ score: parsed.score, feedback: parsed.feedback, status: "graded" }).eq("id", essay_id);
    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
