import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function geminiJSON(system: string, user: string, key: string): Promise<any> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096, responseMimeType: "application/json" },
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
    const { exam_id } = await req.json();
    const { data: exam } = await supabase.from("exams").select("user_id").eq("id", exam_id).single();
    if (!exam) throw new Error("Exam not found");
    const { data: existingEssays } = await supabase.from("essays").select("theme").eq("exam_id", exam_id);
    const existingThemes = (existingEssays || []).map((e: any) => e.theme).join("; ");

    const system = `Você é especialista em redação do ENEM. Crie uma proposta COMPLETA no padrão oficial.
A proposta contém:
1. TEMA: titulo claro em destaque
2. COLETANEA: 4 a 5 textos motivadores de fontes variadas (artigos, dados, trechos literarios) sem entregar a solucao
3. COMANDO: "A partir da leitura dos textos motivadores e com base nos conhecimentos construidos ao longo de sua formacao, redija um texto dissertativo-argumentativo..."
4. INSTRUCOES: linhas (entre 7 e 30), proibicao de assinar, obrigatoriedade de proposta de intervencao social
NUNCA use travessoes. Responda APENAS JSON.`;

    const user = `Crie uma proposta de redacao ENEM completa. Tema atual e relevante para a realidade brasileira.
Temas ja usados (evite): ${existingThemes || "nenhum"}
Retorne JSON: { "theme": "...", "collection_text": "... (markdown completo com coletanea, comando e instrucoes)" }`;

    const parsed = await geminiJSON(system, user, geminiKey);
    await supabase.from("essays").insert({ exam_id, user_id: exam.user_id, theme: parsed.theme || "Tema não gerado", collection_text: parsed.collection_text || null, status: "draft" });
    return new Response(JSON.stringify({ success: true, theme: parsed.theme }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
