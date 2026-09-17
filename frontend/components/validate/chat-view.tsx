'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Check, CheckCircle2, Loader2, Lock, Pencil, RotateCcw, Send } from 'lucide-react'
import { describeError, hitlApi } from '@/lib/api'
import {
  AGENTS,
  answerText,
  buildMarketResearchInput,
  buildMarketingInput,
  buildOrchestratorIntake,
  buildPricingInput,
  buildProductStrategistInput,
  questionsFor,
  type Steering,
} from '@/lib/hitl/agents'
import { addMessage, createChat, getChat, getMessages, updateChat } from '@/lib/hitl/chatStore'
import {
  isDegraded,
  type AgentOutputs,
  type Answers,
  type ChatRow,
  type HitlOrchestratorOutput,
  type MessageRow,
  type ReportBundle,
  type SubAgentId,
} from '@/lib/hitl/types'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/ui/logo'
import McqStep from '@/components/validate/mcq-step'
import ReportView from '@/components/validate/report-view'
import { AgentOutputView } from '@/components/validate/agent-output'
import { displayName, useSession } from '@/components/validate/session'

// ── helpers ──────────────────────────────────────────────────────────

/** Messages for one agent since its inputs were last reset. */
function agentWindow(messages: MessageRow[], agentId: string): MessageRow[] {
  const mine = messages.filter(m => m.agent_id === agentId)
  let start = 0
  mine.forEach((m, i) => {
    if (m.payload?.kind === 'reset') start = i + 1
  })
  return mine.slice(start)
}

function lastIntake(win: MessageRow[]): Answers | null {
  for (let i = win.length - 1; i >= 0; i--) {
    const p = win[i].payload
    if (p?.kind === 'intake') return p.answers
  }
  return null
}

function lastGoodOutput(win: MessageRow[], before = win.length): AgentOutputs[SubAgentId] | null {
  for (let i = before - 1; i >= 0; i--) {
    const p = win[i].payload
    if (p?.kind === 'output' && !isDegraded(p.output)) return p.output as AgentOutputs[SubAgentId]
  }
  return null
}

async function callAgent(agent: SubAgentId, answers: Answers, approved: Partial<AgentOutputs>, steer: Steering) {
  switch (agent) {
    case 'market_research':
      return hitlApi.marketResearch(buildMarketResearchInput(answers, steer))
    case 'product_strategist':
      return hitlApi.productStrategist(buildProductStrategistInput(answers, approved, steer))
    case 'financial':
      return hitlApi.pricing(buildPricingInput(answers, approved, steer))
    case 'marketing':
      return hitlApi.marketing(buildMarketingInput(answers, approved, steer))
  }
}

const SECTION_LABELS: Record<string, string> = {
  market_trends: 'Market trends',
  market_size_estimate: 'Market size',
  competitor_analysis: 'Competitors',
  customer_pain_points: 'Pain points',
  data_confidence: 'Data confidence',
  core_pain_point_anchor: 'Pain point anchor',
  value_proposition: 'Value proposition',
  mvp_features: 'MVP features',
  ui_vibe_specification: 'UI direction',
  pricing_tiers: 'Pricing tiers',
  recommended_channels: 'Channels',
  brand_taglines: 'Taglines',
  sample_campaign_posts: 'Campaign posts & prompts',
}

/** Which labelled sections differ between two versions of an agent output. */
function changedSections(prev: object, next: object): string[] {
  const a = prev as Record<string, unknown>
  const b = next as Record<string, unknown>
  return Object.keys(SECTION_LABELS).filter(k => k in b && JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => SECTION_LABELS[k])
}

// ── presentational bits ──────────────────────────────────────────────

function Stepper({ current, viewing, onSelect }: { current: number; viewing: number; onSelect: (i: number) => void }) {
  return (
    <ol className="scroll-x flex gap-1 px-4 py-3 sm:px-8">
      {AGENTS.map(a => {
        const done = current > a.index
        const active = viewing === a.index
        const reachable = a.index <= current
        return (
          <li key={a.id} className="shrink-0">
            <button
              disabled={!reachable}
              onClick={() => onSelect(a.index)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap',
                active ? 'bg-[#1F1C17] text-[#F5F3EF]' : reachable ? 'text-[#A8A49C] hover:text-[#F5F3EF]' : 'text-[#43443E]'
              )}
            >
              {done ? (
                <CheckCircle2 size={13} className="text-[#B9C99A]" />
              ) : (
                <span className={cn('font-mono text-[11px]', current === a.index ? 'text-[#E7D296]' : '')}>{a.index + 1}</span>
              )}
              <span className="sm:hidden">{a.short}</span>
              <span className="hidden sm:inline">{a.name}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <LogoMark size={26} className="mt-0.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-md text-[14px] leading-relaxed text-[#F5F3EF]">
        {children}
      </div>
    </div>
  )
}

function ErrorLine({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-lg border border-[#C97A63]/40 bg-[#C97A63]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-[13px] text-[#E3A28C]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span className="break-words">{message}</span>
      </p>
      {onRetry && (
        <button onClick={onRetry} className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#43443E] px-3 py-1.5 text-[12px] text-[#F5F3EF] hover:border-[#6E6B64] sm:self-auto">
          <RotateCcw size={12} /> Retry
        </button>
      )}
    </div>
  )
}

function Working({ label }: { label: string }) {
  return (
    <AgentBubble>
      <p className="flex items-center gap-2 py-1 text-[13px] text-[#A8A49C]">
        <Loader2 size={14} className="animate-spin text-[#E7D296]" />
        {label}
      </p>
    </AgentBubble>
  )
}

// ── main view ────────────────────────────────────────────────────────

export default function ChatView({ chatId }: { chatId: string | null }) {
  const session = useSession()
  const router = useRouter()

  const [chat, setChat] = useState<ChatRow | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(!!chatId)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [revision, setRevision] = useState('')
  const runGuard = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load (or reset for a brand-new chat).
  useEffect(() => {
    let cancelled = false
    setChat(null)
    setMessages([])
    setViewIndex(null)
    setRunError(null)
    setActionError(null)
    setEditing(false)
    runGuard.current = null
    if (!chatId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError(null)
    Promise.all([getChat(chatId), getMessages(chatId)])
      .then(([c, m]) => {
        if (cancelled) return
        if (!c) setLoadError('This chat does not exist or you do not have access to it.')
        setChat(c)
        setMessages(m)
      })
      .catch(e => !cancelled && setLoadError(describeError(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [chatId])

  const current = chat?.current_agent_index ?? 0
  const viewing = viewIndex ?? Math.min(current, 4)
  const agent = AGENTS[viewing]
  const approved = useMemo(() => chat?.approved_outputs ?? {}, [chat])
  const win = useMemo(() => agentWindow(messages, agent.id), [messages, agent.id])
  const intake = lastIntake(win)
  const last = win[win.length - 1]
  const lastOutput = last?.payload?.kind === 'output' ? last.payload.output : null
  const needsRun = !!chat && viewing === current && current < 4 && !!intake && last?.sender === 'user'

  // Follow the conversation, but never on an empty intake form — that would
  // scroll past the agent header and the first questions.
  useEffect(() => {
    if (messages.length === 0 && !running) return
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, running, viewing])

  const append = (m: MessageRow) => setMessages(prev => [...prev, m])

  // ── run the active sub-agent ─────────────────────────────────────
  const runAgent = useCallback(
    async (c: ChatRow, agentId: SubAgentId, window: MessageRow[]) => {
      const answers = lastIntake(window)
      const trigger = [...window].reverse().find(m => m.sender === 'user')
      if (!answers || !trigger) return
      const steer: Steering = {}
      if (trigger.payload?.kind === 'revision') {
        steer.revision_request = trigger.content
        steer.previous_output = lastGoodOutput(window, window.indexOf(trigger))
      }
      setRunning(true)
      setRunError(null)
      try {
        // The backend returns the agent's note to the founder next to the output
        // fields; keep it as the message text so the stored output stays schema-exact.
        const { reply_to_founder: reply, ...result } = (await callAgent(agentId, answers, c.approved_outputs, steer)) as Record<string, unknown>
        const saved = await addMessage({
          chat_id: c.id,
          agent_id: agentId,
          sender: 'agent',
          content: isDegraded(result) ? result.error : typeof reply === 'string' ? reply : '',
          payload: { kind: 'output', output: result as unknown as AgentOutputs[SubAgentId] },
        })
        append(saved)
      } catch (e) {
        setRunError(describeError(e))
      } finally {
        setRunning(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!chat || !needsRun || running || runError || !last) return
    if (runGuard.current === last.id) return
    runGuard.current = last.id
    void runAgent(chat, agent.id as SubAgentId, win)
  }, [chat, needsRun, running, runError, last, agent.id, win, runAgent])

  // ── orchestrator: runs automatically once Agent 4 is approved ─────
  const runOrchestrator = useCallback(
    async (c: ChatRow) => {
      setRunning(true)
      setRunError(null)
      try {
        const outs = c.approved_outputs as AgentOutputs
        const orchestrator = await hitlApi.synthesize<HitlOrchestratorOutput>({
          intake: buildOrchestratorIntake(session.user.id, c.intake, outs),
          market_research_output: outs.market_research,
          product_strategy_output: outs.product_strategist,
          pricing_output: outs.financial,
          marketing_output: outs.marketing,
        })
        // Re-read the title in case the chat was renamed from the sidebar meanwhile.
        const fresh = await getChat(c.id)
        const report: ReportBundle = { title: fresh?.title ?? c.title, generated_at: new Date().toISOString(), orchestrator, outputs: outs }
        const updated = await updateChat(c.id, { report, status: 'completed', current_agent_index: 5 })
        setChat(updated)
        setViewIndex(null)
      } catch (e) {
        setRunError(describeError(e))
      } finally {
        setRunning(false)
      }
    },
    [session.user.id]
  )

  useEffect(() => {
    if (!chat || chat.current_agent_index !== 4 || running || runError) return
    if (runGuard.current === `orc:${chat.id}`) return
    runGuard.current = `orc:${chat.id}`
    void runOrchestrator(chat)
  }, [chat, running, runError, runOrchestrator])

  // ── founder actions ──────────────────────────────────────────────
  async function submitIntake(answers: Answers) {
    setBusy(true)
    setActionError(null)
    try {
      const agentId = agent.id as SubAgentId
      const content = questionsFor(agentId, approved)
        .map(q => `${q.prompt}\n→ ${answerText(answers[q.id])}`)
        .join('\n\n')
      if (!chat) {
        const created = await createChat(session.user.id, answerText(answers.idea))
        await addMessage({ chat_id: created.id, agent_id: 'market_research', sender: 'user', content, payload: { kind: 'intake', answers } })
        router.replace(`/validate/${created.id}`)
        return
      }
      if (editing) {
        append(await addMessage({ chat_id: chat.id, agent_id: agentId, sender: 'system', content: 'Inputs edited', payload: { kind: 'reset' } }))
        if (agentId === 'market_research') {
          setChat(await updateChat(chat.id, { title: answerText(answers.idea).slice(0, 120) }))
        }
      }
      runGuard.current = null
      setRunError(null)
      append(await addMessage({ chat_id: chat.id, agent_id: agentId, sender: 'user', content, payload: { kind: 'intake', answers } }))
      setEditing(false)
    } catch (e) {
      setActionError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  async function sendRevision(e: React.FormEvent) {
    e.preventDefault()
    const text = revision.trim()
    if (!chat || !text || running) return
    setBusy(true)
    setActionError(null)
    try {
      runGuard.current = null
      setRunError(null)
      append(await addMessage({ chat_id: chat.id, agent_id: agent.id, sender: 'user', content: text.slice(0, 2000), payload: { kind: 'revision' } }))
      setRevision('')
    } catch (err) {
      setActionError(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    if (!chat || !lastOutput || isDegraded(lastOutput) || !intake) return
    const agentId = agent.id as SubAgentId
    setBusy(true)
    setActionError(null)
    try {
      const updated = await updateChat(chat.id, {
        approved_outputs: { ...chat.approved_outputs, [agentId]: lastOutput },
        intake: { ...chat.intake, [agentId]: intake },
        current_agent_index: current + 1,
      })
      append(await addMessage({ chat_id: chat.id, agent_id: agentId, sender: 'system', content: 'Approved', payload: { kind: 'approved' } }))
      runGuard.current = null
      setRunError(null)
      setChat(updated)
      setViewIndex(null)
    } catch (e) {
      setActionError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  function retry() {
    if (!chat) return
    setRunError(null)
    runGuard.current = null
    if (current === 4) return // the orchestrator effect re-fires once runError clears
    if (last?.sender === 'agent') void runAgent(chat, agent.id as SubAgentId, win)
  }

  // ── render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-[#8C887F]">
        <Loader2 size={16} className="animate-spin" /> Loading chat…
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-24">
        <ErrorLine message={loadError} />
      </div>
    )
  }

  if (chat && chat.current_agent_index === 5 && chat.report && viewIndex === null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Stepper current={5} viewing={4} onSelect={i => setViewIndex(i === 4 ? null : i)} />
        <div className="flex-1 overflow-y-auto">
          <ReportView
            report={chat.report}
            shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/report/share/${chat.share_id}` : null}
            authorName={displayName(session)}
          />
        </div>
      </div>
    )
  }

  const agentId = agent.id as SubAgentId
  const isApprovedView = viewing < current
  const questions = viewing < 4 ? questionsFor(agentId, approved) : []
  const showIntakeForm = viewing < 4 && !isApprovedView && (!intake || editing)
  const hasGoodOutput = !!lastOutput && !isDegraded(lastOutput)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Stepper
        current={chat ? current : 0}
        viewing={viewing}
        onSelect={i => {
          setEditing(false)
          setViewIndex(i === Math.min(current, 4) ? null : i)
          if (i === 4 && current === 5) setViewIndex(null)
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-6 px-4 pt-4 pb-10 sm:px-8">
          <header>
            <p className="font-mono text-[12px] text-[#6E6B64]">Agent {viewing + 1} of 5</p>
            <h1 className="mt-1 break-words font-serif text-[26px] leading-tight text-[#F5F3EF] sm:text-[30px] lg:text-[36px]">{agent.name}</h1>
            <p className="mt-1 text-[14px] text-[#A8A49C]">{agent.blurb}</p>
          </header>

          {/* Read-only view of an already-approved agent */}
          {isApprovedView && viewing < 4 && approved[agentId] && (
            <>
              <p className="flex items-center gap-1.5 text-[12px] text-[#B9C99A]">
                <Lock size={12} /> Approved and locked
              </p>
              <AgentOutputView agent={agentId} output={approved[agentId]!} />
            </>
          )}

          {/* Orchestrator step */}
          {viewing === 4 && (
            running ? (
              <Working label="The Orchestrator is aggregating your four approved outputs into the final verdict…" />
            ) : runError ? (
              <ErrorLine message={runError} onRetry={retry} />
            ) : (
              <Working label="Preparing the final report…" />
            )
          )}

          {/* Active sub-agent thread */}
          {viewing < 4 && !isApprovedView && (
            <>
              {!chat && (
                <AgentBubble>
                  <p className="text-[14px] leading-relaxed text-[#D6D2C9]">
                    Answer a few structured questions and I&apos;ll run a live market scan. You&apos;ll review each agent&apos;s output, push back where it&apos;s wrong, and approve it before the next agent starts.
                  </p>
                </AgentBubble>
              )}

              {!editing &&
                win.map((m, idx) => {
                  const p = m.payload
                  if (p?.kind === 'intake') return <UserBubble key={m.id}>{m.content}</UserBubble>
                  if (p?.kind === 'revision') return <UserBubble key={m.id}>{m.content}</UserBubble>
                  if (p?.kind === 'output') {
                    const superseded = idx !== win.length - 1
                    const prevGood = idx > 0 && win[idx - 1].payload?.kind === 'revision' ? lastGoodOutput(win, idx) : null
                    const changes = prevGood && !isDegraded(p.output) ? changedSections(prevGood, p.output) : null
                    return (
                      <AgentBubble key={m.id}>
                        {isDegraded(p.output) ? (
                          <ErrorLine
                            message={`The agent couldn't produce a valid result: ${p.output.error}`}
                            onRetry={idx === win.length - 1 && !running ? retry : undefined}
                          />
                        ) : superseded ? (
                          <details className="text-[13px] text-[#8C887F]">
                            <summary className="cursor-pointer select-none">Earlier version (superseded)</summary>
                            <div className="mt-4">
                              <AgentOutputView agent={agentId} output={p.output as AgentOutputs[SubAgentId]} />
                            </div>
                          </details>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {(m.content || changes) && (
                              <div className="rounded-xl border border-[#E7D296]/25 bg-[#E7D296]/[0.06] px-4 py-3">
                                {changes && (
                                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E7D296]">
                                    {changes.length ? `Revised · changed: ${changes.join(', ')}` : 'No changes to the output'}
                                  </p>
                                )}
                                {m.content && <p className="text-[14px] leading-relaxed text-[#F5F3EF]">{m.content}</p>}
                              </div>
                            )}
                            <AgentOutputView agent={agentId} output={p.output as AgentOutputs[SubAgentId]} />
                          </div>
                        )}
                      </AgentBubble>
                    )
                  }
                  return null
                })}

              {showIntakeForm && (
                <AgentBubble>
                  <McqStep
                    key={`${agent.id}-${editing ? 'edit' : 'new'}`}
                    questions={questions}
                    initial={editing ? intake ?? undefined : undefined}
                    submitLabel={editing ? 'Re-run with new inputs' : `Run ${agent.name}`}
                    busy={busy}
                    onSubmit={submitIntake}
                    onCancel={editing ? () => setEditing(false) : undefined}
                  />
                </AgentBubble>
              )}

              {running && <Working label={`${agent.name} is working — this usually takes 20–60 seconds…`} />}
              {runError && !running && <ErrorLine message={runError} onRetry={retry} />}
            </>
          )}

          {actionError && <ErrorLine message={actionError} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Review bar: counter-arguments + approve */}
      {chat && viewing < 4 && !isApprovedView && !editing && intake && !running && lastOutput && (
        <div className="border-t border-white/10 bg-[#0A0908]/70 px-4 py-3 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex max-w-[820px] flex-col gap-2.5">
            {agentId === 'financial' && hasGoodOutput && (
              <p className="text-[12px] text-[#8C887F]">
                Prices and unit economics are calculated from your inputs, not generated. Feedback changes tier bucketing and copy; use Edit inputs to change the numbers.
              </p>
            )}
            <form onSubmit={sendRevision} className="flex items-end gap-2">
              <textarea
                value={revision}
                onChange={e => setRevision(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={`Push back on ${agent.name}'s output or ask for changes…`}
                aria-label="Feedback for the active agent"
                className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-[#2A2722] bg-black/40 px-3.5 py-2.5 text-[14px] text-white placeholder:text-[#6E6B64] outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!revision.trim() || busy}
                aria-label="Send feedback"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-[#050405] hover:bg-amber-300 disabled:bg-[#1A1815] disabled:text-[#43443E]"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setEditing(true)}
                disabled={busy}
                className="flex items-center gap-1.5 text-[12px] text-[#A8A49C] hover:text-white"
              >
                <Pencil size={12} /> Edit inputs
              </button>
              <button
                onClick={approve}
                disabled={!hasGoodOutput || busy}
                title={hasGoodOutput ? undefined : 'Retry the agent until it returns a valid output'}
                className="flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#050405] hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-[#1A1815] disabled:text-[#43443E]"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {viewing === 3 ? 'Approve & build report' : 'Approve & Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
