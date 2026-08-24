/**
 * Networking Assistant Panel
 * AI-powered networking message generation and strategy
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  MessageSquare,
  Send,
  Copy,
  Check,
  Linkedin,
  Mail,
  Globe,
  Lightbulb,
  UserPlus,
} from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AiConsentGate } from './AiConsentGate'
import {
  AIResultCard,
  CollapsibleSection,
  AIList,
  CopyButton,
} from './AIResultCard'
import {
  getNetworkingHelp,
  type NetworkingHelpParams,
  type NetworkingHelpResult,
} from '@/services/aiCareerAssistantApi'
import { AI_FEATURES } from '@/config/features'
import { cn } from '@/lib/utils'

type Platform = 'LinkedIn' | 'Email' | 'Other'

interface NetworkingAssistantProps {
  contactName?: string
  contactTitle?: string
  contactCompany?: string
  userBackground?: string
  className?: string
}

export function NetworkingAssistant({
  contactName: initialName,
  contactTitle: initialTitle,
  contactCompany: initialCompany,
  userBackground,
  className,
}: NetworkingAssistantProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NetworkingHelpResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Form state
  const [contactName, setContactName] = useState(initialName || '')
  const [contactTitle, setContactTitle] = useState(initialTitle || '')
  const [contactCompany, setContactCompany] = useState(initialCompany || '')
  const [userGoal, setUserGoal] = useState('')
  const [platform, setPlatform] = useState<Platform>('LinkedIn')

  if (!AI_FEATURES.NETWORKING_HELP) {
    return null
  }

  const handleGenerate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: NetworkingHelpParams = {
        contactName: contactName.trim() || undefined,
        contactTitle: contactTitle.trim() || undefined,
        contactCompany: contactCompany.trim() || undefined,
        userGoal: userGoal.trim() || undefined,
        userBackground,
        platform,
      }

      const response = await getNetworkingHelp(params)
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMessage = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.suggestedMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const platformIcons = {
    LinkedIn: <Linkedin className="w-4 h-4" />,
    Email: <Mail className="w-4 h-4" />,
    Other: <Globe className="w-4 h-4" />,
  }

  if (!result && !isLoading && !error) {
    return (
      <AiConsentGate compact featureName={t('ai.networking.featureName')}>
        <div className={cn('p-5 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800', className)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-stone-800 dark:text-stone-200">
                {t('ai.networking.heading')}
              </h4>
              <p className="text-sm text-stone-600 dark:text-stone-600">
                {t('ai.networking.subheading')}
              </p>
            </div>
          </div>

          {/* Platform Selection */}
          <div className="flex gap-2 mb-4">
            {(['LinkedIn', 'Email', 'Other'] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  platform === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                )}
              >
                {platformIcons[p]}
                {p === 'Other' ? t('ai.networking.platformOther') : p}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input
              placeholder={t('ai.networking.placeholderName')}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={t('ai.networking.placeholderTitle')}
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
              />
              <Input
                placeholder={t('ai.networking.placeholderCompany')}
                value={contactCompany}
                onChange={(e) => setContactCompany(e.target.value)}
              />
            </div>
            <Input
              placeholder={t('ai.networking.placeholderGoal')}
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
            />
            <Button
              onClick={handleGenerate}
              className="w-full"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              {t('ai.networking.generateButton')}
            </Button>
          </div>
        </div>
      </AiConsentGate>
    )
  }

  return (
    <AiConsentGate compact featureName={t('ai.networking.featureName')}>
      <AIResultCard
        aiGenerated={!!result}
        title={t('ai.networking.title')}
        subtitle={contactName || contactCompany || t('ai.networking.strategyFallback')}
        icon={<Users className="w-5 h-5 text-white" />}
        isLoading={isLoading}
        loadingText={t('ai.networking.loadingMessage')}
        error={error}
        onRetry={handleGenerate}
        className={className}
        headerActions={
          result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResult(null)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {t('ai.networking.newMessage')}
            </Button>
          )
        }
      >
        {result && (
          <div className="space-y-4">
            {/* Main Message */}
            <div className="relative">
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="text-xs text-stone-600">
                  {t('ai.networking.charCount', { count: result.suggestedMessage.length })}
                </span>
                <button
                  onClick={handleCopyMessage}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  )}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-2 mb-3">
                  {platformIcons[platform]}
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    {t('ai.networking.platformMessage', { platform })}
                  </span>
                </div>
                <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-wrap pr-16">
                  {result.suggestedMessage}
                </p>
              </div>
            </div>

            {/* Alternative Openings */}
            {result.alternativeOpenings.length > 0 && (
              <CollapsibleSection
                title={t('ai.networking.alternativeOpenings')}
                icon={<MessageSquare className="w-4 h-4" />}
                badge={result.alternativeOpenings.length}
              >
                <div className="space-y-2">
                  {result.alternativeOpenings.map((opening, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50"
                    >
                      <p className="text-sm text-stone-700 dark:text-stone-300">
                        {opening}
                      </p>
                      <CopyButton text={opening} />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Follow-up Strategy */}
            {result.followUpStrategy.length > 0 && (
              <CollapsibleSection
                title={t('ai.networking.followUpStrategy')}
                icon={<Send className="w-4 h-4" />}
                badge={result.followUpStrategy.length}
              >
                <ol className="space-y-2">
                  {result.followUpStrategy.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--c-accent)]/40 dark:bg-[var(--c-bg)]/50 flex items-center justify-center text-xs font-medium text-[var(--c-text)] dark:text-[var(--c-solid)]">
                        {i + 1}
                      </span>
                      <span className="text-sm text-stone-700 dark:text-stone-300 pt-0.5">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </CollapsibleSection>
            )}

            {/* Relevant Groups */}
            {result.relevantGroups.length > 0 && (
              <CollapsibleSection
                title={t('ai.networking.relevantGroups')}
                icon={<UserPlus className="w-4 h-4" />}
                badge={result.relevantGroups.length}
              >
                <div className="space-y-2">
                  {result.relevantGroups.map((group, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-stone-200 dark:border-stone-700"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-stone-800 dark:text-stone-200">
                          {group.name}
                        </span>
                        <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-full text-xs text-stone-600 dark:text-stone-600">
                          {group.platform}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-600">
                        {group.relevance}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Networking Tips */}
            {result.networkingTips.length > 0 && (
              <CollapsibleSection
                title={t('ai.networking.networkingTips')}
                icon={<Lightbulb className="w-4 h-4" />}
              >
                <AIList items={result.networkingTips} />
              </CollapsibleSection>
            )}

            {/* LinkedIn Tips */}
            {result.linkedInTips.length > 0 && (
              <CollapsibleSection
                title={t('ai.networking.linkedInTips')}
                icon={<Linkedin className="w-4 h-4" />}
              >
                <AIList items={result.linkedInTips} />
              </CollapsibleSection>
            )}
          </div>
        )}
      </AIResultCard>
    </AiConsentGate>
  )
}

export default NetworkingAssistant
