import { ColorField } from './components/ColorField'
import { IconCropModal } from './components/IconCropModal'
import { LivePreview } from './components/LivePreview'
import { PreviewCanvas } from './components/PreviewCanvas'
import { TextField } from './components/TextField'
import { UploadCard } from './components/UploadCard'
import { PLATFORM_OPTIONS, UPLOAD_SLOTS, optionLabel } from './lib/appController/config'
import { useAppController } from './lib/useAppController'
import { type Theme } from './lib/useTheme'
import './App.css'

type AppController = ReturnType<typeof useAppController>

type ThemeToggleProps = {
  onChange: (theme: Theme) => void
  theme: Theme
}

type UploadSectionProps = Pick<
  AppController,
  'autoCrop' | 'clearUpload' | 'openCropDialog' | 'setAutoCropEnabled' | 'updateUpload' | 'uploads'
>

type ConfigureSectionProps = Pick<
  AppController,
  'appJsonResult' | 'config' | 'pastedAppJson' | 'setPastedAppJson' | 'updateConfig'
>

type PreviewSectionProps = Pick<
  AppController,
  'canGenerate' | 'config' | 'handleGenerate' | 'isGenerating' | 'uploads'
>

type ResultsSectionProps = Pick<
  AppController,
  | 'appJsonPreview'
  | 'appJsonTitle'
  | 'generated'
  | 'handleCopyJson'
  | 'handleDownload'
  | 'isDownloading'
  | 'jsonCopied'
  | 'platformFilter'
  | 'resultsRef'
  | 'setPlatformFilter'
  | 'totalAssets'
>

function App() {
  const controller = useAppController()

  return (
    <>
      <TopBar
        onThemeChange={controller.setTheme}
        theme={controller.theme}
      />

      <main className="page">
        <Hero />
        <FeedbackNotice feedback={controller.feedback} />
        <UploadSection {...controller} />
        <ConfigureSection {...controller} />
        <PreviewSection {...controller} />
        <ResultsSection {...controller} />
      </main>

      <IconCropModal
        key={cropDialogKey(controller.cropDialog)}
        draft={controller.cropDialog}
        onCancel={controller.closeCropDialog}
        onSave={controller.saveCrop}
        title={cropDialogTitle(controller.cropDialog)}
      />

      <Footer />
    </>
  )
}

function TopBar({
  onThemeChange,
  theme,
}: Readonly<{ onThemeChange: (theme: Theme) => void; theme: Theme }>) {
  return (
    <nav className="topbar">
      <div className="topbar-brand">
        <div className="topbar-icon">
          <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        </div>
        <span className="topbar-name">Assets Chef</span>
      </div>
      <div className="topbar-right">
        <ThemeToggle theme={theme} onChange={onThemeChange} />
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <header className="hero">
      <h1>One icon in, every asset out</h1>
      <p className="hero-sub">
        Upload your app icon and get production-ready exports for Expo, iOS,
        Android, and the web — correctly sized, named, and zipped.
      </p>
    </header>
  )
}

function FeedbackNotice({ feedback }: Readonly<{ feedback: string | null }>) {
  if (!feedback) {
    return null
  }

  return (
    <div className="notice notice--info">
      <p>{feedback}</p>
    </div>
  )
}

function UploadSection({
  autoCrop,
  clearUpload,
  openCropDialog,
  setAutoCropEnabled,
  updateUpload,
  uploads,
}: Readonly<UploadSectionProps>) {
  function handleAutoCropChange(enabled: boolean) {
    setAutoCropEnabled('light', enabled)
    setAutoCropEnabled('dark', enabled)
  }

  return (
    <section className="zone" id="upload" style={{ '--zone': 1 } as React.CSSProperties}>
      <div className="zone-header">
        <div className="zone-title">
          <h2>Source artwork</h2>
          <p className="zone-inline-note">(1024×1024 px recommended, 512×512 minimum)</p>
        </div>
        <div className="upload-header-toggles">
          <label className="switch-field">
            <input
              checked={autoCrop.light && autoCrop.dark}
              onChange={(event) => handleAutoCropChange(event.target.checked)}
              type="checkbox"
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
            <span className="switch-label">Auto Crop</span>
          </label>
        </div>
      </div>

      <div className="grid grid--uploads">
        {UPLOAD_SLOTS.map(({ slot, title }) => (
          <UploadCard
            error={uploads[slot].error}
            key={slot}
            onAdjustCrop={slot === 'light' || slot === 'dark' ? () => openCropDialog(slot) : undefined}
            onClear={() => clearUpload(slot)}
            onFileSelected={(file) => updateUpload(slot, file)}
            required={slot === 'light' || slot === 'splash'}
            title={title}
            upload={uploads[slot].upload}
          />
        ))}
      </div>
    </section>
  )
}

function ConfigureSection({
  appJsonResult,
  config,
  pastedAppJson,
  setPastedAppJson,
  updateConfig,
}: Readonly<ConfigureSectionProps>) {
  return (
    <section className="zone" id="configure" style={{ '--zone': 2 } as React.CSSProperties}>
      <div className="zone-header">
        <div className="zone-title">
          <h2>Configure</h2>
        </div>
        <p className="zone-desc">Colors, optional web metadata, and your existing app.json.</p>
      </div>

      <div className="grid grid--config">
        <TextField
          label="Web app name in site.webmanifest"
          onChange={(value) => updateConfig('appName', value)}
          placeholder="Acme Mobile"
          value={config.appName}
        />
        <TextField
          label="Short name in site.webmanifest"
          onChange={(value) => updateConfig('appShortName', value)}
          placeholder="Acme"
          value={config.appShortName}
        />
        <ColorField
          label="Adaptive Icon BG"
          onChange={(value) => updateConfig('adaptiveIconBackgroundColor', value)}
          value={config.adaptiveIconBackgroundColor}
        />
        <ColorField
          label="Splash BG · Light"
          onChange={(value) => updateConfig('splashBackgroundLight', value)}
          value={config.splashBackgroundLight}
        />
        <ColorField
          label="Splash BG · Dark"
          onChange={(value) => updateConfig('splashBackgroundDark', value)}
          value={config.splashBackgroundDark}
        />
      </div>

      <div className="paste-area">
        <div className="paste-area-head">
          <div>
            <span className="field-label">
              Existing app.json
              <span className="optional-badge">optional</span>
            </span>
            <p className="field-desc">
              Paste your current app.json. After generating, the copy button gives you a fully merged file ready to drop in — no manual editing.
            </p>
          </div>
          {pastedAppJson ? (
            <button
              className="btn-clear"
              onClick={() => setPastedAppJson('')}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>

        <textarea
          className="code-input"
          onChange={(event) => setPastedAppJson(event.target.value)}
          placeholder={'{\n  "expo": {\n    "name": "Acme Mobile"\n  }\n}'}
          spellCheck={false}
          value={pastedAppJson}
        />

        {appJsonResult.mode === 'invalid' ? (
          <p className="helper-text error">{appJsonResult.error}</p>
        ) : null}
      </div>
    </section>
  )
}

function PreviewSection({
  canGenerate,
  config,
  handleGenerate,
  isGenerating,
  uploads,
}: Readonly<PreviewSectionProps>) {
  const showHint = !uploads.light.upload || !uploads.splash.upload

  return (
    <section className="zone" id="preview" style={{ '--zone': 3 } as React.CSSProperties}>
      <div className="zone-header">
        <div className="zone-title">
          <h2>Preview</h2>
        </div>
        <p className="zone-desc">Live preview as you configure.</p>
      </div>

      <LivePreview
        adaptiveBg={config.adaptiveIconBackgroundColor}
        bgDark={config.splashBackgroundDark}
        bgLight={config.splashBackgroundLight}
        iconDark={uploads.dark.upload?.url}
        iconLight={uploads.light.upload?.url}
        splashDark={uploads.splashDark.upload?.url}
        splashLight={uploads.splash.upload?.url}
      />

      <div className="generate-row">
        <button
          className="btn btn--primary"
          disabled={!canGenerate}
          onClick={handleGenerate}
          type="button"
        >
          {isGenerating ? 'Generating…' : 'Generate assets'}
        </button>
        {showHint ? (
          <span className="generate-hint">Upload a light icon and light splash first</span>
        ) : null}
      </div>
    </section>
  )
}

function ResultsSection({
  appJsonPreview,
  appJsonTitle,
  generated,
  handleCopyJson,
  handleDownload,
  isDownloading,
  jsonCopied,
  platformFilter,
  resultsRef,
  setPlatformFilter,
  totalAssets,
}: Readonly<ResultsSectionProps>) {
  if (!generated) {
    return null
  }

  return (
    <section
      className="zone results-zone"
      id="results"
      ref={resultsRef}
      style={{ '--zone': 4 } as React.CSSProperties}
    >
      <div className="zone-header">
        <div className="zone-title">
          <h2>Results</h2>
        </div>
      </div>

      <div className="grid grid--previews">
        <PreviewCanvas blob={generated.previews.iosIcon} label="iOS Icon" />
        <PreviewCanvas blob={generated.previews.androidAdaptive} label="Android Adaptive" />
        <PreviewCanvas blob={generated.previews.splash} label="Splash Screen" />
        <PreviewCanvas blob={generated.previews.tinted} label="Tinted / Mono" />
      </div>

      <div className="results-grid">
        <div className="appjson-card">
          <div className="appjson-bar">
            <div className="appjson-bar-left">
              <span className="appjson-title">{appJsonTitle}</span>
              <span className="code-lang-tag">Expo</span>
            </div>
            <button
              className={`copy-btn${jsonCopied ? ' copy-btn--done' : ''}`}
              onClick={handleCopyJson}
              type="button"
            >
              <CopyButtonContent copied={jsonCopied} />
            </button>
          </div>

          <pre className="appjson-code"><code>{appJsonPreview}</code></pre>
        </div>

        <div className="export-panel">
          <div
            aria-label="Platform filter"
            className="pill-row"
            role="tablist"
          >
            {PLATFORM_OPTIONS.map((option) => (
              <button
                aria-pressed={platformFilter === option.value}
                className={`pill${platformFilter === option.value ? ' pill--active' : ''}`}
                key={option.value}
                onClick={() => setPlatformFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="export-count">
            {totalAssets} files · {platformLabel(platformFilter)}
          </p>

          <button
            className="btn btn--secondary"
            disabled={isDownloading}
            onClick={handleDownload}
            type="button"
          >
            {isDownloading ? 'Preparing ZIP…' : 'Download ZIP'}
          </button>
        </div>
      </div>
    </section>
  )
}

function CopyButtonContent({ copied }: Readonly<{ copied: boolean }>) {
  if (copied) {
    return (
      <>
        <svg fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
          <polyline points="2.5 8 6 12 13.5 4" />
        </svg>
        Copied
      </>
    )
  }

  return (
    <>
      <svg fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
        <rect x="5.5" y="5.5" width="8" height="9" rx="1.5" />
        <path d="M10 5.5V4A1.5 1.5 0 0 0 8.5 2.5h-4A1.5 1.5 0 0 0 3 4v8A1.5 1.5 0 0 0 4.5 13.5H5.5" />
      </svg>
      Copy
    </>
  )
}

function cropDialogKey(cropDialog: AppController['cropDialog']) {
  if (!cropDialog) {
    return 'crop-modal-closed'
  }

  return `${cropDialog.slot}:${cropDialog.source.url}:${cropDialog.initialCropArea.x}:${cropDialog.initialCropArea.y}:${cropDialog.initialCropArea.width}`
}

function cropDialogTitle(cropDialog: AppController['cropDialog']) {
  if (!cropDialog) {
    return 'Crop icon'
  }

  return `Crop ${cropDialog.slot === 'light' ? 'Light Icon' : 'Dark Icon'}`
}

function platformLabel(filter: AppController['platformFilter']) {
  return filter === 'all' ? 'All platforms' : optionLabel(filter)
}

function Footer() {
  return (
    <footer className="footer">
      <p>Assets Chef &mdash; 100% client-side asset generation &mdash; by <a href="https://github.com/Azula9713" target="_blank" rel="noopener noreferrer">@Azula9713</a></p>
    </footer>
  )
}

function ThemeToggle({ onChange, theme }: Readonly<ThemeToggleProps>) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
        className={`theme-btn${theme === 'light' ? ' theme-btn--active' : ''}`}
        onClick={() => onChange('light')}
        title="Light"
        type="button"
      >
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      </button>
      <button
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
        className={`theme-btn${theme === 'dark' ? ' theme-btn--active' : ''}`}
        onClick={() => onChange('dark')}
        title="Dark"
        type="button"
      >
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3c0 4.97 4.03 9 9 9 .27 0 .53-.01.79-.04z" />
        </svg>
      </button>
    </div>
  )
}

export default App
