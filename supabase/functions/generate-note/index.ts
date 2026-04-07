import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function gemini(system: string, user: string, key: string): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }),
  });
  if (!r.ok) throw new Error(`Gemini error: ${r.status}`);
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SERVICE_ROLE_KEY")!);
  const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
  try {
    const { note_id } = await req.json();
    await supabase.from("study_notes").update({ status: "generating" }).eq("id", note_id);
    const { data: note } = await supabase.from("study_notes").select("*, notebooks(name, description, exams(name, exam_type))").eq("id", note_id).single();
    if (!note) throw new Error("Note not found");
    const examName = (note as any).notebooks?.exams?.name || "";
    const notebookName = (note as any).notebooks?.name || "";

    const system = `Você é um especialista em educação. Produza conteúdo técnico denso e bem formatado em português brasileiro.
REGRAS:
- Use ## para títulos, ### para subtítulos, com linha em branco antes e depois
- Linha em branco entre parágrafos
- Use **negrito** para conceitos-chave
- Tabelas Markdown quando houver dados comparativos
- Mínimo 3000 palavras, conteúdo autossuficiente
- NUNCA use saudações, despedidas, tom pessoal, "Prezado", "Bons estudos"
- Vá DIRETO ao conteúdo, impessoal e técnico
- NUNCA use travessões (-- ou -), substitua por vírgulas ou pontos`;

    const user = `Produza um apunte COMPLETO sobre: "${note.title}"
Contexto: "${notebookName}" para "${examName}".
Cubra: conceitos, teoria, classificações (tabelas), exemplos, pontos de prova, jurisprudência/técnica, resumo esquemático.
Sem introdução pessoal. Conteúdo direto e impessoal.`;

    const content = await gemini(system, user, geminiKey);
    await supabase.from("study_notes").update({ content, status: "ready", updated_at: new Date().toISOString() }).eq("id", note_id);
    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
