import { startTransition, useEffect, useRef, useState } from 'react'

import { generateAssets, serializeSiteManifest } from './assetGenerator'
import {
  INITIAL_CONFIG,
  type AppConfig,
} from './appController/config'
import {
  buildAppJsonResult,
  collectInputs,
  collectWarnings,
  countAssets,
  downloadBlob,
  getErrorMessage,
  withUpdatedAppJson,
  withUpdatedSiteManifest,
  resolveWebManifestNames,
} from './appController/helpers'
import { useUploads } from './appController/useUploads'
import type { GeneratedAssets, PlatformFilter } from './types'
import { useTheme } from './useTheme'
import { buildZip } from './zipBuilder'

export function useAppController() {
  const { theme, setTheme } = useTheme()
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG)
  const [generated, setGenerated] = useState<GeneratedAssets | null>(null)
  const [pastedAppJson, setPastedAppJson] = useState('')
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [jsonCopied, setJsonCopied] = useState(false)
  const resultsRef = useRef<HTMLElement>(null)
  const { uploads, clearUpload, updateUpload } = useUploads({
    onSuccessfulChange: () => {
      setGenerated(null)
      setFeedback(null)
    },
  })

  const hasDarkIcon = Boolean(uploads.dark.upload)
  const appJsonResult = buildAppJsonResult(config, pastedAppJson, hasDarkIcon)
  const appJsonPreview = generated ? appJsonResult.text : ''
  const appJsonTitle = appJsonResult.mode === 'merged' ? 'Merged app.json' : 'app.json snippet'
  const allWarnings = collectWarnings(uploads)
  const totalAssets = countAssets(generated, platformFilter)
  const canGenerate = Boolean(uploads.light.upload && uploads.splash.upload) && !isGenerating
  const { appName, appShortName, pastedExpoName } = resolveWebManifestNames(config, pastedAppJson)

  useEffect(() => {
    if (generated) {
      globalThis.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }, [generated])

  function updateConfig(key: keyof AppConfig, value: string) {
    setConfig((current) => ({ ...current, [key]: value }))
    setGenerated(null)
    setFeedback(null)
  }

  async function handleGenerate() {
    const inputs = collectInputs(uploads, config)

    if (!inputs) {
      setFeedback('Upload a light icon and light splash before generating.')
      return
    }

    setIsGenerating(true)
    setFeedback(null)

    try {
      const nextGenerated = await generateAssets({ ...inputs, appName, appShortName })
      startTransition(() => {
        setGenerated(nextGenerated)
      })
    } catch (error) {
      setFeedback(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    if (!generated) {
      setFeedback('Generate assets first.')
      return
    }

    setIsDownloading(true)
    setFeedback(null)

    try {
      const siteManifestText = serializeSiteManifest(
        config.splashBackgroundLight,
        appName,
        appShortName,
      )
      const zipBlob = await buildZip(
        withUpdatedSiteManifest(
          withUpdatedAppJson(generated.manifest, appJsonResult.text),
          siteManifestText,
        ),
        platformFilter,
      )
      const fileName =
        platformFilter === 'all'
          ? 'assets-chef-all-platforms.zip'
          : `assets-chef-${platformFilter}.zip`

      downloadBlob(zipBlob, fileName)
      setFeedback(
        appJsonResult.mode === 'merged'
          ? `Downloaded ${fileName} with your merged expo/app.json.`
          : `Downloaded ${fileName}.`,
      )
    } catch (error) {
      setFeedback(getErrorMessage(error))
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleCopyJson() {
    if (!appJsonPreview) return

    try {
      await navigator.clipboard.writeText(appJsonPreview)
      setJsonCopied(true)
      globalThis.setTimeout(() => setJsonCopied(false), 2000)
    } catch {
      setFeedback('Copy failed — select the text manually.')
    }
  }

  return {
    theme,
    setTheme,
    uploads,
    config,
    generated,
    pastedAppJson,
    platformFilter,
    isGenerating,
    isDownloading,
    feedback,
    jsonCopied,
    resultsRef,
    allWarnings,
    totalAssets,
    canGenerate,
    appJsonResult,
    appJsonPreview,
    appJsonTitle,
    pastedExpoName,
    setPastedAppJson,
    setPlatformFilter,
    updateUpload,
    clearUpload,
    updateConfig,
    handleGenerate,
    handleDownload,
    handleCopyJson,
  }
}
