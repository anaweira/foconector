import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  type Node, type Edge, MarkerType, BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const BRANCH_COLORS = [
  'hsl(350, 65%, 35%)', 'hsl(155, 40%, 40%)', 'hsl(210, 60%, 45%)',
  'hsl(35, 75%, 50%)', 'hsl(280, 45%, 45%)', 'hsl(0, 60%, 45%)',
  'hsl(180, 40%, 40%)', 'hsl(45, 70%, 45%)',
];

interface SyllabusSubject { name: string; topics?: string[]; }

export default function MindMapPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const mapStructuredMindMap = useCallback((mindMap: any, examName: string) => {
    const mappedNodes: Node[] = (mindMap?.nodes || []).map((node: any, index: number) => ({
      id: String(node.id),
      position: node.position || { x: 240 + (index % 4) * 260, y: 80 + Math.floor(index / 4) * 140 },
      data: { label: node.label },
      style: node.parent
        ? {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: `1.5px solid ${BRANCH_COLORS[index % BRANCH_COLORS.length]}55`,
            borderRadius: '10px',
            padding: '8px 14px',
            maxWidth: '220px',
            fontSize: '12px',
            textAlign: 'center' as const,
          }
        : {
            background: BRANCH_COLORS[index % BRANCH_COLORS.length],
            color: 'white',
            borderRadius: '12px',
            padding: '10px 18px',
            fontWeight: 600,
            maxWidth: '240px',
            textAlign: 'center' as const,
          },
    }));

    if (!mappedNodes.find((node) => node.id === 'root')) {
      mappedNodes.unshift({
        id: 'root',
        position: { x: 560, y: 40 },
        data: { label: examName },
        style: {
          background: 'linear-gradient(135deg, hsl(350, 65%, 28%), hsl(350, 65%, 38%))',
          color: 'white',
          fontWeight: 700,
          fontSize: '15px',
          borderRadius: '16px',
          padding: '14px 28px',
          border: 'none',
          minWidth: '160px',
          textAlign: 'center' as const,
        },
      });
    }

    const mappedEdges: Edge[] = (mindMap?.edges || []).map((edge: any, index: number) => ({
      id: `edge-${index}`,
      source: String(edge.source),
      target: String(edge.target),
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
    }));

    setNodes(mappedNodes);
    setEdges(mappedEdges);
  }, [setEdges, setNodes]);

  const buildGraph = useCallback((subjects: SyllabusSubject[], examName: string) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const centerX = 600, centerY = 80;

    newNodes.push({
      id: 'root', position: { x: centerX - 80, y: centerY },
      data: { label: examName },
      style: { background: 'linear-gradient(135deg, hsl(350, 65%, 28%), hsl(350, 65%, 38%))', color: 'white', fontWeight: 700, fontSize: '15px', borderRadius: '16px', padding: '14px 28px', border: 'none', boxShadow: '0 8px 24px rgba(90,26,42,0.35)', minWidth: '160px', textAlign: 'center' as const },
    });

    const cols = 2, spacingX = 500, spacingY = 220, startY = centerY + 180;
    subjects.forEach((subject, i) => {
      const subId = `sub-${i}`;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const subX = col === 0 ? centerX - spacingX / 2 - 60 : centerX + spacingX / 2 - 60;
      const subY = startY + row * spacingY;
      const color = BRANCH_COLORS[i % BRANCH_COLORS.length];

      newNodes.push({
        id: subId, position: { x: subX, y: subY },
        data: { label: typeof subject === 'string' ? subject : (subject.name || subject) },
        style: { background: color, color: 'white', fontWeight: 600, fontSize: '12px', borderRadius: '12px', padding: '10px 18px', border: 'none', maxWidth: '220px', textAlign: 'center' as const, boxShadow: `0 4px 14px ${color}44` },
      });
      newEdges.push({ id: `e-root-${subId}`, source: 'root', target: subId, style: { stroke: color, strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color }, type: 'smoothstep' });

      const topics = subject.topics || [];
      const topicSpacingY = 42;
      const topicOffsetX = col === 0 ? -260 : 260;
      topics.forEach((topic: string, j: number) => {
        const topicId = `topic-${i}-${j}`;
        const tx = subX + topicOffsetX;
        const ty = subY - ((topics.length - 1) * topicSpacingY) / 2 + j * topicSpacingY;
        newNodes.push({
          id: topicId, position: { x: tx, y: ty },
          data: { label: topic },
          style: { background: `${color}18`, color: 'hsl(var(--foreground))', fontSize: '10px', borderRadius: '8px', padding: '6px 10px', border: `1.5px solid ${color}40`, maxWidth: '190px', textAlign: 'center' as const },
        });
        newEdges.push({ id: `e-${subId}-${topicId}`, source: subId, target: topicId, style: { stroke: `${color}60`, strokeWidth: 1.5 }, type: 'smoothstep' });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const { data } = await supabase.from('exams').select('*').eq('id', id).eq('user_id', user.id).single();
      setExam(data);
      if (data) {
        const mm = data.mind_map as any;
        const syl = data.syllabus as any;
        const mindMapData = mm?.subjects || syl?.subjects || [];
        if (Array.isArray(mm?.nodes) && Array.isArray(mm?.edges) && mm.nodes.length > 0) {
          mapStructuredMindMap(mm, data.name);
        } else if (mindMapData.length > 0) {
          buildGraph(mindMapData, data.name);
        }
      }
      setLoading(false);
    };
    load();
  }, [user, id, buildGraph, mapStructuredMindMap]);

  if (loading) {
    return (<div className="space-y-4"><div className="skeleton-pulse h-8 w-48" /><div className="skeleton-pulse h-[500px] rounded-lg" /></div>);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-xl font-bold tracking-tight">Mapa Mental: {exam?.name}</h1>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden" style={{ height: '75vh' }}>
        {nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Mapa mental ainda não disponível para este estudo.</div>
        ) : (
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView fitViewOptions={{ padding: 0.3 }} minZoom={0.05} maxZoom={2}>
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap style={{ background: 'hsl(var(--card))' }} maskColor="hsl(var(--muted) / 0.5)" nodeColor={(node) => {
            if (node.id === 'root') return 'hsl(350, 65%, 28%)';
            if (node.id.startsWith('sub-')) return BRANCH_COLORS[parseInt(node.id.split('-')[1]) % BRANCH_COLORS.length];
            return 'hsl(var(--muted))';
          }} />
        </ReactFlow>
        )}
      </div>
    </div>
  );
}