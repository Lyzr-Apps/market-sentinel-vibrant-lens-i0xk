'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { useCopyToClipboard } from '@/lib/clipboard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  HiOutlineChartBar,
  HiOutlineSearch,
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlineShieldExclamation,
  HiOutlineTrendingUp,
  HiOutlineNewspaper,
  HiOutlineChatAlt2,
  HiOutlineClipboardCopy,
  HiOutlineClipboardCheck,
  HiOutlineRefresh,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineMinusCircle,
  HiOutlineXCircle,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlineUserGroup,
  HiOutlineDocumentReport,
  HiOutlineBeaker,
  HiOutlineCode,
  HiOutlineTag,
  HiOutlineInformationCircle,
} from 'react-icons/hi'

// --- Interfaces ---

interface Competitor {
  name: string
  positioning: string
  threat_level: string
}

interface NewsItem {
  headline: string
  source: string
  relevance: string
}

interface NotableOpinion {
  opinion: string
  sentiment: string
}

interface RiskConcern {
  concern: string
  severity: string
  source: string
}

interface Recommendation {
  recommendation: string
  priority: string
  rationale: string
}

interface OverallSentiment {
  web_sentiment: string
  developer_sentiment: string
  combined_rating: string
  sentiment_summary: string
}

interface MarketLandscape {
  overview: string
  key_competitors: Competitor[]
  market_trends: string[]
  recent_news: NewsItem[]
}

interface DeveloperPulse {
  sentiment_overview: string
  key_themes: string[]
  notable_opinions: NotableOpinion[]
  discussion_activity: string
}

interface MarketReport {
  executive_summary: string
  overall_sentiment: OverallSentiment
  market_landscape: MarketLandscape
  developer_community_pulse: DeveloperPulse
  risks_and_concerns: RiskConcern[]
  strategic_recommendations: Recommendation[]
}

// --- Constants ---

const AGENT_ID = '69a0221026973c6deb9ae315'

const AGENTS = [
  { id: '69a0221026973c6deb9ae315', name: 'Market Research Coordinator', purpose: 'Orchestrates sub-agents and synthesizes unified report' },
  { id: '69a021e03dc260b752bd754c', name: 'Web Intelligence Agent', purpose: 'Searches web for market sentiment and competitive intelligence' },
  { id: '69a021f526973c6deb9ae30f', name: 'Hacker News Analyst Agent', purpose: 'Analyzes developer community discussions and sentiment' },
]

const LOADING_MESSAGES = [
  'Initializing market research...',
  'Searching the web for market intelligence...',
  'Analyzing competitive landscape...',
  'Scanning Hacker News discussions...',
  'Evaluating developer sentiment...',
  'Synthesizing findings into report...',
  'Generating strategic recommendations...',
  'Finalizing analysis...',
]

const SAMPLE_DATA: MarketReport = {
  executive_summary: 'The AI-powered code editor market is experiencing rapid growth with strong developer adoption. Market sentiment is broadly positive, though concerns about privacy, vendor lock-in, and pricing sustainability persist. Key players include GitHub Copilot, Cursor, and Tabnine, each targeting different segments. Developer community discussions highlight a strong demand for local/offline capabilities and transparent AI training practices.',
  overall_sentiment: {
    web_sentiment: 'Positive',
    developer_sentiment: 'Cautiously Optimistic',
    combined_rating: '7.2/10',
    sentiment_summary: 'Web coverage is overwhelmingly positive with major tech publications praising AI coding tools. Developer sentiment on Hacker News is more nuanced, with enthusiasm tempered by practical concerns about accuracy, privacy, and cost.',
  },
  market_landscape: {
    overview: 'The AI code assistant market is projected to reach $14.6B by 2027, growing at 28% CAGR. Major cloud providers and startups are competing aggressively. Integration with existing developer workflows is a key differentiator.',
    key_competitors: [
      { name: 'GitHub Copilot', positioning: 'Market leader with deep VS Code integration', threat_level: 'High' },
      { name: 'Cursor', positioning: 'Full IDE replacement with AI-native approach', threat_level: 'High' },
      { name: 'Tabnine', positioning: 'Privacy-focused with on-premise option', threat_level: 'Medium' },
      { name: 'Amazon CodeWhisperer', positioning: 'AWS ecosystem integration play', threat_level: 'Medium' },
      { name: 'Codeium', positioning: 'Free tier aggressive market capture', threat_level: 'Medium' },
    ],
    market_trends: [
      'Shift from autocomplete to agentic coding workflows',
      'Growing demand for local/offline AI models',
      'Enterprise compliance driving on-premise deployments',
      'Multi-model support becoming table stakes',
      'Integration with CI/CD pipelines for automated testing',
    ],
    recent_news: [
      { headline: 'GitHub Copilot reaches 1.8M paid subscribers', source: 'TechCrunch', relevance: 'High - validates market size' },
      { headline: 'Cursor raises $100M Series B at $2.5B valuation', source: 'The Information', relevance: 'High - shows investor confidence' },
      { headline: 'EU proposes AI transparency requirements for code generation', source: 'Reuters', relevance: 'Medium - regulatory risk signal' },
      { headline: 'Stack Overflow traffic drops 35% amid AI coding tool adoption', source: 'Ars Technica', relevance: 'High - adoption indicator' },
    ],
  },
  developer_community_pulse: {
    sentiment_overview: 'The Hacker News community shows genuine excitement about AI coding tools but maintains healthy skepticism. Power users report 30-50% productivity gains, while critics highlight hallucination issues and overreliance concerns. Discussion activity has increased 3x in the past 6 months.',
    key_themes: [
      'Code quality vs. speed tradeoffs',
      'Privacy of proprietary codebases',
      'Impact on junior developer learning',
      'Open source model alternatives',
      'Context window limitations',
      'Multi-file refactoring capabilities',
    ],
    notable_opinions: [
      { opinion: 'These tools are genuinely transformative for boilerplate code, but I still manually review every suggestion for production systems.', sentiment: 'Positive' },
      { opinion: 'The real concern is training on GPL code without proper attribution. Legal risks are being massively underpriced.', sentiment: 'Negative' },
      { opinion: 'Local models like CodeLlama are catching up fast. The gap with cloud-hosted solutions is narrowing every quarter.', sentiment: 'Neutral' },
      { opinion: 'Our team saw a 40% reduction in time-to-PR after adopting AI coding tools. The ROI is undeniable.', sentiment: 'Positive' },
    ],
    discussion_activity: 'Very High - averaging 200+ comments on related threads, with 15+ front-page posts in the last month',
  },
  risks_and_concerns: [
    { concern: 'IP and copyright liability from AI-generated code', severity: 'High', source: 'Legal analysis & HN discussions' },
    { concern: 'Over-reliance reducing fundamental coding skills', severity: 'Medium', source: 'Developer community sentiment' },
    { concern: 'Pricing pressure as free alternatives improve', severity: 'High', source: 'Web market analysis' },
    { concern: 'Data privacy and proprietary code exposure', severity: 'High', source: 'Enterprise feedback & HN threads' },
    { concern: 'Model hallucinations introducing subtle bugs', severity: 'Medium', source: 'Developer experience reports' },
  ],
  strategic_recommendations: [
    { recommendation: 'Invest in on-premise/local deployment options to address enterprise privacy concerns', priority: 'High', rationale: 'Privacy is the #1 concern across both web sentiment and developer discussions. Companies offering local options are gaining enterprise traction.' },
    { recommendation: 'Develop transparent AI training data practices and clear attribution systems', priority: 'High', rationale: 'Legal and ethical concerns around training data are creating market opportunities for transparent players.' },
    { recommendation: 'Build agentic workflows beyond simple autocomplete', priority: 'Medium', rationale: 'Market is shifting from completion to full coding agents. Early movers in this space will capture the next growth wave.' },
    { recommendation: 'Offer a competitive free tier to build developer community and mindshare', priority: 'Medium', rationale: 'Codeium and other free alternatives are capturing significant market share. A strong free tier drives adoption.' },
  ],
}

// --- Helpers ---

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function getSentimentColor(sentiment: string): string {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('positive') || s.includes('high') || s.includes('good') || s.includes('strong')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  if (s.includes('negative') || s.includes('low') || s.includes('poor') || s.includes('weak')) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (s.includes('mixed') || s.includes('neutral') || s.includes('moderate') || s.includes('medium') || s.includes('cautious')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

function getSentimentIcon(sentiment: string) {
  const s = (sentiment ?? '').toLowerCase()
  if (s.includes('positive') || s.includes('high') || s.includes('good') || s.includes('strong')) return <HiOutlineCheckCircle className="w-4 h-4" />
  if (s.includes('negative') || s.includes('low') || s.includes('poor') || s.includes('weak')) return <HiOutlineXCircle className="w-4 h-4" />
  if (s.includes('mixed') || s.includes('neutral') || s.includes('moderate') || s.includes('medium') || s.includes('cautious')) return <HiOutlineMinusCircle className="w-4 h-4" />
  return <HiOutlineInformationCircle className="w-4 h-4" />
}

function getThreatColor(level: string): string {
  const l = (level ?? '').toLowerCase()
  if (l.includes('high') || l.includes('critical')) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (l.includes('medium') || l.includes('moderate')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (l.includes('low') || l.includes('minor')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function getPriorityColor(priority: string): string {
  const p = (priority ?? '').toLowerCase()
  if (p.includes('high') || p.includes('critical') || p.includes('urgent')) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (p.includes('medium') || p.includes('moderate')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (p.includes('low')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

function buildReportText(report: MarketReport): string {
  const lines: string[] = []
  lines.push('=== MARKETPULSE REPORT ===\n')
  lines.push('EXECUTIVE SUMMARY')
  lines.push(report.executive_summary ?? '')
  lines.push('\nOVERALL SENTIMENT')
  lines.push(`Web Sentiment: ${report.overall_sentiment?.web_sentiment ?? 'N/A'}`)
  lines.push(`Developer Sentiment: ${report.overall_sentiment?.developer_sentiment ?? 'N/A'}`)
  lines.push(`Combined Rating: ${report.overall_sentiment?.combined_rating ?? 'N/A'}`)
  lines.push(report.overall_sentiment?.sentiment_summary ?? '')
  lines.push('\nMARKET LANDSCAPE')
  lines.push(report.market_landscape?.overview ?? '')
  const competitors = Array.isArray(report.market_landscape?.key_competitors) ? report.market_landscape.key_competitors : []
  if (competitors.length > 0) {
    lines.push('\nKey Competitors:')
    competitors.forEach(c => lines.push(`- ${c?.name ?? 'N/A'}: ${c?.positioning ?? 'N/A'} (Threat: ${c?.threat_level ?? 'N/A'})`))
  }
  const trends = Array.isArray(report.market_landscape?.market_trends) ? report.market_landscape.market_trends : []
  if (trends.length > 0) {
    lines.push('\nMarket Trends:')
    trends.forEach(t => lines.push(`- ${t ?? ''}`))
  }
  const news = Array.isArray(report.market_landscape?.recent_news) ? report.market_landscape.recent_news : []
  if (news.length > 0) {
    lines.push('\nRecent News:')
    news.forEach(n => lines.push(`- ${n?.headline ?? 'N/A'} (${n?.source ?? 'N/A'}) - ${n?.relevance ?? ''}`))
  }
  lines.push('\nDEVELOPER COMMUNITY PULSE')
  lines.push(report.developer_community_pulse?.sentiment_overview ?? '')
  const themes = Array.isArray(report.developer_community_pulse?.key_themes) ? report.developer_community_pulse.key_themes : []
  if (themes.length > 0) {
    lines.push('\nKey Themes:')
    themes.forEach(t => lines.push(`- ${t ?? ''}`))
  }
  const opinions = Array.isArray(report.developer_community_pulse?.notable_opinions) ? report.developer_community_pulse.notable_opinions : []
  if (opinions.length > 0) {
    lines.push('\nNotable Opinions:')
    opinions.forEach(o => lines.push(`- "${o?.opinion ?? ''}" [${o?.sentiment ?? 'N/A'}]`))
  }
  lines.push(`\nDiscussion Activity: ${report.developer_community_pulse?.discussion_activity ?? 'N/A'}`)
  const risks = Array.isArray(report.risks_and_concerns) ? report.risks_and_concerns : []
  if (risks.length > 0) {
    lines.push('\nRISKS & CONCERNS')
    risks.forEach(r => lines.push(`- [${r?.severity ?? 'N/A'}] ${r?.concern ?? 'N/A'} (Source: ${r?.source ?? 'N/A'})`))
  }
  const recs = Array.isArray(report.strategic_recommendations) ? report.strategic_recommendations : []
  if (recs.length > 0) {
    lines.push('\nSTRATEGIC RECOMMENDATIONS')
    recs.forEach(r => lines.push(`- [${r?.priority ?? 'N/A'}] ${r?.recommendation ?? 'N/A'}\n  Rationale: ${r?.rationale ?? 'N/A'}`))
  }
  return lines.join('\n')
}

// --- Sub-components ---

function SentimentCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <div className="mb-2 text-slate-400">{icon}</div>
      <span className="text-xs text-slate-400 mb-1 text-center">{label}</span>
      <Badge className={`${getSentimentColor(value)} border text-xs`}>
        {value || 'N/A'}
      </Badge>
    </div>
  )
}

function LoadingState({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2">
          <HiOutlineSearch className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-200">Analyzing Market...</h3>
        <p className="text-sm text-slate-400 min-h-[20px]">{message}</p>
        <div className="max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-2/3 bg-slate-700" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full bg-slate-700" />
              <Skeleton className="h-4 w-5/6 bg-slate-700" />
              <Skeleton className="h-4 w-4/6 bg-slate-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700/50 mb-6">
        <HiOutlineChartBar className="w-10 h-10 text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-200 mb-2">Ready to Analyze</h3>
      <p className="text-slate-400 max-w-md text-sm leading-relaxed">
        Enter a product name, concept, or market idea above to generate a comprehensive market research report powered by AI. The analysis covers web sentiment, competitive landscape, developer community pulse, risks, and strategic recommendations.
      </p>
      <div className="flex gap-3 mt-8 flex-wrap justify-center">
        {['Web Sentiment', 'Competitor Analysis', 'Developer Pulse', 'Risk Assessment'].map(tag => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700/50">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function ExecutiveSummaryTab({ report }: { report: MarketReport }) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <HiOutlineDocumentReport className="w-5 h-5 text-blue-400" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderMarkdown(report?.executive_summary ?? '')}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <HiOutlineStar className="w-5 h-5 text-amber-400" />
            Overall Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SentimentCard
              label="Web Sentiment"
              value={report?.overall_sentiment?.web_sentiment ?? 'N/A'}
              icon={<HiOutlineGlobeAlt className="w-5 h-5" />}
            />
            <SentimentCard
              label="Developer Sentiment"
              value={report?.overall_sentiment?.developer_sentiment ?? 'N/A'}
              icon={<HiOutlineCode className="w-5 h-5" />}
            />
            <SentimentCard
              label="Combined Rating"
              value={report?.overall_sentiment?.combined_rating ?? 'N/A'}
              icon={<HiOutlineChartBar className="w-5 h-5" />}
            />
          </div>
          <Separator className="bg-slate-700/50" />
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Sentiment Summary</h4>
            <div className="text-sm text-slate-400 leading-relaxed">
              {renderMarkdown(report?.overall_sentiment?.sentiment_summary ?? '')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MarketLandscapeTab({ report }: { report: MarketReport }) {
  const competitors = Array.isArray(report?.market_landscape?.key_competitors) ? report.market_landscape.key_competitors : []
  const trends = Array.isArray(report?.market_landscape?.market_trends) ? report.market_landscape.market_trends : []
  const news = Array.isArray(report?.market_landscape?.recent_news) ? report.market_landscape.recent_news : []

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <HiOutlineGlobeAlt className="w-5 h-5 text-blue-400" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderMarkdown(report?.market_landscape?.overview ?? '')}
          </div>
        </CardContent>
      </Card>

      {competitors.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineUserGroup className="w-5 h-5 text-indigo-400" />
              Key Competitors
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">{competitors.length} competitors identified</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs font-medium">Name</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium">Positioning</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium text-right">Threat Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((c, i) => (
                    <TableRow key={i} className="border-slate-700/30 hover:bg-slate-700/20">
                      <TableCell className="font-medium text-slate-200 text-sm">{c?.name ?? 'N/A'}</TableCell>
                      <TableCell className="text-slate-400 text-sm">{c?.positioning ?? 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${getThreatColor(c?.threat_level ?? '')} border text-xs`}>
                          {c?.threat_level ?? 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {trends.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineTrendingUp className="w-5 h-5 text-emerald-400" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trends.map((trend, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <HiOutlineArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-300">{trend ?? ''}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {news.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineNewspaper className="w-5 h-5 text-amber-400" />
              Recent News
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {news.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h4 className="text-sm font-medium text-slate-200">{item?.headline ?? 'N/A'}</h4>
                    <Badge variant="outline" className="text-xs shrink-0 border-slate-600 text-slate-400">{item?.source ?? 'N/A'}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{item?.relevance ?? ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DeveloperPulseTab({ report }: { report: MarketReport }) {
  const themes = Array.isArray(report?.developer_community_pulse?.key_themes) ? report.developer_community_pulse.key_themes : []
  const opinions = Array.isArray(report?.developer_community_pulse?.notable_opinions) ? report.developer_community_pulse.notable_opinions : []

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <HiOutlineChatAlt2 className="w-5 h-5 text-orange-400" />
            Sentiment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderMarkdown(report?.developer_community_pulse?.sentiment_overview ?? '')}
          </div>
        </CardContent>
      </Card>

      {themes.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineTag className="w-5 h-5 text-purple-400" />
              Key Discussion Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme, i) => (
                <Badge key={i} variant="outline" className="text-xs px-3 py-1.5 border-slate-600 text-slate-300 bg-slate-800/50">
                  {theme ?? ''}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {opinions.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineLightBulb className="w-5 h-5 text-yellow-400" />
              Notable Opinions
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">{opinions.length} notable opinions from the developer community</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opinions.map((op, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getSentimentIcon(op?.sentiment ?? '')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        &ldquo;{op?.opinion ?? ''}&rdquo;
                      </p>
                      <div className="mt-2">
                        <Badge className={`${getSentimentColor(op?.sentiment ?? '')} border text-xs`}>
                          {op?.sentiment ?? 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <HiOutlineChartBar className="w-5 h-5 text-blue-400" />
            Discussion Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-300 leading-relaxed">
            {renderMarkdown(report?.developer_community_pulse?.discussion_activity ?? 'No data available')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RisksRecommendationsTab({ report }: { report: MarketReport }) {
  const risks = Array.isArray(report?.risks_and_concerns) ? report.risks_and_concerns : []
  const recs = Array.isArray(report?.strategic_recommendations) ? report.strategic_recommendations : []

  return (
    <div className="space-y-6">
      {risks.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineShieldExclamation className="w-5 h-5 text-red-400" />
              Risks & Concerns
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">{risks.length} risks identified</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs font-medium">Concern</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium">Severity</TableHead>
                    <TableHead className="text-slate-400 text-xs font-medium">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk, i) => (
                    <TableRow key={i} className="border-slate-700/30 hover:bg-slate-700/20">
                      <TableCell className="text-sm text-slate-300">{risk?.concern ?? 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={`${getThreatColor(risk?.severity ?? '')} border text-xs`}>
                          {risk?.severity ?? 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">{risk?.source ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {recs.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-200">
              <HiOutlineLightBulb className="w-5 h-5 text-emerald-400" />
              Strategic Recommendations
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">{recs.length} recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recs.map((rec, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/30">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-medium text-slate-200 flex-1">{rec?.recommendation ?? 'N/A'}</h4>
                    <Badge className={`${getPriorityColor(rec?.priority ?? '')} border text-xs shrink-0`}>
                      {rec?.priority ?? 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{rec?.rationale ?? ''}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
          <HiOutlineBeaker className="w-4 h-4 text-blue-400" />
          Powering Agents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {AGENTS.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full shrink-0 ${activeAgentId === agent.id ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`font-medium ${activeAgentId === agent.id ? 'text-blue-400' : 'text-slate-400'}`}>{agent.name}</span>
              <span className="text-slate-600 hidden sm:inline">- {agent.purpose}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// --- ErrorBoundary ---

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-500 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Page ---

export default function Page() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0)
  const [report, setReport] = useState<MarketReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showSample, setShowSample] = useState(false)
  const [copyFn, copied] = useCopyToClipboard()

  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const startLoadingAnimation = useCallback(() => {
    setLoadingProgress(0)
    setLoadingMessageIdx(0)

    let msgIdx = 0
    loadingIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMessageIdx(msgIdx)
    }, 4000)

    let prog = 0
    progressIntervalRef.current = setInterval(() => {
      prog = Math.min(prog + Math.random() * 3 + 0.5, 90)
      setLoadingProgress(prog)
    }, 800)
  }, [])

  const handleAnalyze = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setReport(null)
    setActiveAgentId(AGENT_ID)
    startLoadingAnimation()

    try {
      let message = `Analyze the market for: ${query.trim()}`
      if (context.trim()) {
        message += `\n\nAdditional context: ${context.trim()}`
      }

      const result = await callAIAgent(message, AGENT_ID)

      clearTimers()
      setLoadingProgress(100)

      if (result.success && result.response) {
        let parsed = result?.response?.result
        if (typeof parsed === 'string') {
          parsed = parseLLMJson(parsed)
        }

        const data: MarketReport = {
          executive_summary: parsed?.executive_summary ?? '',
          overall_sentiment: {
            web_sentiment: parsed?.overall_sentiment?.web_sentiment ?? 'N/A',
            developer_sentiment: parsed?.overall_sentiment?.developer_sentiment ?? 'N/A',
            combined_rating: parsed?.overall_sentiment?.combined_rating ?? 'N/A',
            sentiment_summary: parsed?.overall_sentiment?.sentiment_summary ?? '',
          },
          market_landscape: {
            overview: parsed?.market_landscape?.overview ?? '',
            key_competitors: Array.isArray(parsed?.market_landscape?.key_competitors) ? parsed.market_landscape.key_competitors : [],
            market_trends: Array.isArray(parsed?.market_landscape?.market_trends) ? parsed.market_landscape.market_trends : [],
            recent_news: Array.isArray(parsed?.market_landscape?.recent_news) ? parsed.market_landscape.recent_news : [],
          },
          developer_community_pulse: {
            sentiment_overview: parsed?.developer_community_pulse?.sentiment_overview ?? '',
            key_themes: Array.isArray(parsed?.developer_community_pulse?.key_themes) ? parsed.developer_community_pulse.key_themes : [],
            notable_opinions: Array.isArray(parsed?.developer_community_pulse?.notable_opinions) ? parsed.developer_community_pulse.notable_opinions : [],
            discussion_activity: parsed?.developer_community_pulse?.discussion_activity ?? '',
          },
          risks_and_concerns: Array.isArray(parsed?.risks_and_concerns) ? parsed.risks_and_concerns : [],
          strategic_recommendations: Array.isArray(parsed?.strategic_recommendations) ? parsed.strategic_recommendations : [],
        }

        setReport(data)
      } else {
        setError(result?.error ?? result?.response?.message ?? 'Analysis failed. Please try again.')
      }
    } catch (err) {
      clearTimers()
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleReset = () => {
    setReport(null)
    setError(null)
    setQuery('')
    setContext('')
    setLoadingProgress(0)
    setShowSample(false)
  }

  const handleCopyReport = () => {
    const currentReport = showSample ? SAMPLE_DATA : report
    if (currentReport) {
      copyFn(buildReportText(currentReport))
    }
  }

  const displayReport = showSample ? SAMPLE_DATA : report
  const hasReport = displayReport !== null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
        {/* Header */}
        <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <HiOutlineChartBar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">MarketPulse</h1>
                <p className="text-xs text-slate-500">AI Market Research Analyzer</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-slate-500 cursor-pointer">
                Sample Data
              </Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={setShowSample}
              />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Input Section */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="query" className="text-sm text-slate-300 mb-1.5 block">Product, idea, or concept to research</Label>
                  <Input
                    id="query"
                    placeholder="e.g., AI code editor, smart home automation, plant-based meat alternative..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-slate-900/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 h-11"
                    disabled={loading}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !loading && query.trim()) handleAnalyze() }}
                  />
                </div>
                <div>
                  <Label htmlFor="context" className="text-sm text-slate-300 mb-1.5 block">Additional context (optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Industry, target market, specific questions to investigate..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="bg-slate-900/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 resize-none"
                    rows={2}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={loading || !query.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-10 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <HiOutlineSearch className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <HiOutlineSearch className="w-4 h-4" />
                        Analyze Market
                      </span>
                    )}
                  </Button>
                  {hasReport && !loading && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
                      >
                        <HiOutlineRefresh className="w-4 h-4 mr-1.5" />
                        New Analysis
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyReport}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10"
                      >
                        {copied ? (
                          <span className="flex items-center gap-1.5">
                            <HiOutlineClipboardCheck className="w-4 h-4 text-emerald-400" />
                            Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <HiOutlineClipboardCopy className="w-4 h-4" />
                            Copy Report
                          </span>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && !loading && (
            <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
              <HiOutlineExclamationCircle className="w-5 h-5 text-red-400" />
              <AlertTitle className="text-red-300">Analysis Failed</AlertTitle>
              <AlertDescription className="text-red-400/80 text-sm">{error}</AlertDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                className="mt-3 border-red-500/30 text-red-300 hover:bg-red-500/10"
                disabled={!query.trim()}
              >
                <HiOutlineRefresh className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <LoadingState
              progress={loadingProgress}
              message={LOADING_MESSAGES[loadingMessageIdx] ?? ''}
            />
          )}

          {/* Empty State */}
          {!loading && !hasReport && !error && <EmptyState />}

          {/* Results Dashboard */}
          {!loading && hasReport && displayReport && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="bg-slate-800/60 border border-slate-700/50 h-auto flex-wrap">
                <TabsTrigger value="summary" className="text-xs sm:text-sm data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                  <HiOutlineDocumentReport className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                  Executive Summary
                </TabsTrigger>
                <TabsTrigger value="landscape" className="text-xs sm:text-sm data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                  <HiOutlineGlobeAlt className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                  Market Landscape
                </TabsTrigger>
                <TabsTrigger value="devpulse" className="text-xs sm:text-sm data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                  <HiOutlineCode className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                  Developer Pulse
                </TabsTrigger>
                <TabsTrigger value="risks" className="text-xs sm:text-sm data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300">
                  <HiOutlineShieldExclamation className="w-4 h-4 mr-1.5 hidden sm:inline-block" />
                  Risks & Recs
                </TabsTrigger>
              </TabsList>

              <div className="mt-4">
                <TabsContent value="summary">
                  <ExecutiveSummaryTab report={displayReport} />
                </TabsContent>
                <TabsContent value="landscape">
                  <MarketLandscapeTab report={displayReport} />
                </TabsContent>
                <TabsContent value="devpulse">
                  <DeveloperPulseTab report={displayReport} />
                </TabsContent>
                <TabsContent value="risks">
                  <RisksRecommendationsTab report={displayReport} />
                </TabsContent>
              </div>
            </Tabs>
          )}

          {/* Agent Status Panel */}
          <AgentStatusPanel activeAgentId={activeAgentId} />
        </main>
      </div>
    </ErrorBoundary>
  )
}
