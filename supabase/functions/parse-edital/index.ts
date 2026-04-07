import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function geminiJSON(system: string, user: string, key: string): Promise<any> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 8192, responseMimeType: "application/json" },
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
    const { exam_id, edital_path } = await req.json();
    const { data: fileData } = await supabase.storage.from("editals").download(edital_path);
    if (!fileData) throw new Error("Could not download edital file");
    const pdfText = await fileData.text();

    const system = `Você é especialista em análise de editais de concursos públicos brasileiros.
Crie um caderno para CADA disciplina/matéria. Se o edital lista 11 matérias, crie 11 cadernos.
Nome do caderno: APENAS o nome da disciplina, sem prefixos como "Caderno 01:".
Cada caderno: 15 a 40 tópicos para cobertura total do zero à aprovação.
NUNCA use travessões.
Responda APENAS com JSON válido.`;

    const user = `Analise o edital e extraia o conteúdo programático COMPLETO.
Retorne JSON: { "syllabus": "...", "notebooks": [{"name":"...","description":"...","topics":["..."]}], "mind_map": {"nodes":[{"id":"...","label":"...","parent":"..."}],"edges":[{"source":"...","target":"..."}]} }

Edital:
${pdfText.substring(0, 50000)}`;

    const parsed = await geminiJSON(system, user, geminiKey);
    await supabase.from("exams").update({ syllabus: parsed.syllabus, mind_map: parsed.mind_map || null }).eq("id", exam_id);
    const { data: examData } = await supabase.from("exams").select("user_id").eq("id", exam_id).single();
    const userId = examData!.user_id;

    for (let i = 0; i < (parsed.notebooks || []).length; i++) {
      const nb = parsed.notebooks[i];
      const { data: notebook } = await supabase.from("notebooks").insert({ exam_id, user_id: userId, name: nb.name, description: nb.description, sort_order: i }).select().single();
      if (notebook && nb.topics?.length > 0) {
        await supabase.from("study_notes").insert(nb.topics.map((topic: string, j: number) => ({ notebook_id: notebook.id, user_id: userId, title: topic, sort_order: j, status: "pending" })));
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
