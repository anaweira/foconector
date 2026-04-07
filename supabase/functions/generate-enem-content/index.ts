import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function geminiJSON(system: string, user: string, key: string): Promise<any> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 8192, responseMimeType: "application/json" },
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
    const { exam_id, freeform_topic } = await req.json();
    const { data: exam } = await supabase.from("exams").select("*").eq("id", exam_id).single();
    if (!exam) throw new Error("Exam not found");
    const isFreeform = !!freeform_topic;

    const system = isFreeform
      ? `Crie uma trilha de aprendizado EXTREMAMENTE COMPLETA sobre o tema. 12 a 25 cadernos do básico ao avançado, 20 a 40 tópicos cada. Nome do caderno: apenas o tema/area, sem prefixos. Objetivo: zero à expertise total. NUNCA use travessões. Responda APENAS JSON.`
      : `Crie estrutura COMPLETA de estudo para o ENEM. 15 a 25 cadernos cobrindo TODAS as disciplinas. 25 a 40 tópicos cada. Nome: apenas o nome da disciplina. Cubra Linguagens, Humanas, Natureza, Matematica. NUNCA use travessões. Responda APENAS JSON.`;

    const user = `${isFreeform ? `Trilha completa sobre: "${freeform_topic}"` : "Estrutura completa ENEM"}
Retorne JSON: { "syllabus": "...", "notebooks": [{"name":"...","description":"...","topics":["..."]}], "mind_map": {"nodes":[{"id":"...","label":"...","parent":"..."}],"edges":[{"source":"...","target":"..."}]} }`;

    const parsed = await geminiJSON(system, user, geminiKey);
    await supabase.from("exams").update({ syllabus: parsed.syllabus, mind_map: parsed.mind_map || null }).eq("id", exam_id);

    for (let i = 0; i < (parsed.notebooks || []).length; i++) {
      const nb = parsed.notebooks[i];
      const { data: notebook } = await supabase.from("notebooks").insert({ exam_id, user_id: exam.user_id, name: nb.name, description: nb.description, sort_order: i }).select().single();
      if (notebook && nb.topics?.length > 0) {
        await supabase.from("study_notes").insert(nb.topics.map((topic: string, j: number) => ({ notebook_id: notebook.id, user_id: exam.user_id, title: topic, sort_order: j, status: "pending" })));
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
