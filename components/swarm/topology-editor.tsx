'use client'

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AgentNode, type AgentNodeData } from './agent-node'
import { ConnectionEdge } from './connection-edge'
import { useRpcMutation } from '@/hooks/use-rpc'
import { Save } from 'lucide-react'
import type { AgentInfo } from '@/core/types'

const nodeTypes = { agent: AgentNode }
const edgeTypes = { connection: ConnectionEdge }

function agentsToNodes(agents: AgentInfo[]): Node[] {
  return agents.map((agent, i) => ({
    id: agent.key,
    type: 'agent',
    position: {
      x: 100 + (i % 4) * 200,
      y: 100 + Math.floor(i / 4) * 150,
    },
    data: {
      label: agent.name,
      emoji: agent.emoji,
      model: agent.model,
      enabled: agent.enabled,
      key: agent.key,
    } satisfies AgentNodeData,
  }))
}

function agentsToEdges(agents: AgentInfo[]): Edge[] {
  const edges: Edge[] = []
  for (const agent of agents) {
    if (agent.subagents?.allowAgents) {
      for (const targetKey of agent.subagents.allowAgents) {
        edges.push({
          id: `${agent.key}->${targetKey}`,
          source: agent.key,
          target: targetKey,
          type: 'connection',
          markerEnd: { type: MarkerType.ArrowClosed },
        })
      }
    }
  }
  return edges
}

export function TopologyEditor({
  instanceId,
  agents,
}: {
  instanceId: string
  agents: AgentInfo[]
}) {
  const uniqueAgents = useMemo(() => {
    const seen = new Set<string>()
    return agents.filter((a) => {
      if (seen.has(a.key)) return false
      seen.add(a.key)
      return true
    })
  }, [agents])

  const initialNodes = useMemo(() => agentsToNodes(uniqueAgents), [uniqueAgents])
  const initialEdges = useMemo(() => agentsToEdges(uniqueAgents), [uniqueAgents])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const configPatch = useRpcMutation(instanceId, 'config.patch', {
    invalidateKeys: [['rpc', instanceId, 'agents.list']],
  })

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'connection',
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds,
        ),
      )
    },
    [setEdges],
  )

  const handleSave = useCallback(() => {
    // Build agent subagent config from edges
    const agentSubagents: Record<string, string[]> = {}

    for (const edge of edges) {
      if (!agentSubagents[edge.source]) {
        agentSubagents[edge.source] = []
      }
      agentSubagents[edge.source].push(edge.target)
    }

    // Build config patch
    const agentsPatch: Record<
      string,
      { subagents: { allowAgents: string[] } }
    > = {}
    for (const agent of uniqueAgents) {
      agentsPatch[agent.key] = {
        subagents: {
          allowAgents: agentSubagents[agent.key] ?? [],
        },
      }
    }

    configPatch.mutate({ agents: agentsPatch })
  }, [edges, uniqueAgents, configPatch])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">
          Drag agents to arrange. Connect agents by dragging from bottom handle
          to top handle. Connections define subagent relationships.
        </p>
        <button
          onClick={handleSave}
          disabled={configPatch.isPending}
          className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[var(--primary-hover)] active:scale-[0.96] disabled:opacity-50"
        >
          <Save className="h-3 w-3" />
          {configPatch.isPending ? 'Saving...' : 'Save Topology'}
        </button>
      </div>

      <div className="h-[600px] rounded-lg border border-[var(--border)] glass">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
        >
          <Background key="bg" color="var(--border)" gap={20} />
          <Controls key="controls" />
          <MiniMap
            key="minimap"
            style={{ background: 'var(--card)' }}
            nodeColor="var(--primary)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
