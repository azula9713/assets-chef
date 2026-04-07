import { ColorField } from './components/ColorField'
import { LivePreview } from './components/LivePreview'
import { PreviewCanvas } from './components/PreviewCanvas'
import { TextField } from './components/TextField'
import { UploadCard } from './components/UploadCard'
import { PLATFORM_OPTIONS, UPLOAD_SLOTS, optionLabel } from './lib/appController/config'
import { useAppController } from './lib/useAppController'
import { type Theme } from './lib/useTheme'
import './App.css'

function App() {
  const {
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
    totalAssets,
    canGenerate,
    appJsonResult,
    appJsonPreview,
    appJsonTitle,
    setPastedAppJson,
    setPlatformFilter,
    updateUpload,
    clearUpload,
    updateConfig,
    handleGenerate,
    handleDownload,
    handleCopyJson,
  } = useAppController()

  return (
    <>
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
          <ThemeToggle theme={theme} onChange={setTheme} />
        </div>
      </nav>

      <main className="page">
        <header className="hero">
          <h1>One icon in, every asset out</h1>
          <p className="hero-sub">
            Upload your app icon and get production-ready exports for Expo, iOS,
            Android, and the web — correctly sized, named, and zipped.
          </p>

        </header>

        {feedback && (
          <div className="notice notice--info">
            <p>{feedback}</p>
          </div>
        )}

        {/* Zone 1: Upload */}
        <section className="zone" id="upload" style={{ '--zone': 1 } as React.CSSProperties}>
          <div className="zone-header">
            <div className="zone-title">
              <h2>Source artwork</h2>
            </div>
            <p className="zone-desc">
              (1024×1024 px recommended, 512×512 minimum).
            </p>
          </div>
          <div className="grid grid--uploads">
            {UPLOAD_SLOTS.map(({ slot, title }) => (
              <UploadCard
                error={uploads[slot].error}
                key={slot}
                onClear={() => clearUpload(slot)}
                onFileSelected={(file) => updateUpload(slot, file)}
                required={slot === 'light' || slot === 'splash'}
                title={title}
                upload={uploads[slot].upload}
              />
            ))}
          </div>
        </section>

        {/* Zone 2: Configure */}
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
              {pastedAppJson && (
                <button
                  className="btn-clear"
                  onClick={() => setPastedAppJson('')}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              className="code-input"
              onChange={(e) => setPastedAppJson(e.target.value)}
              placeholder={'{\n  "expo": {\n    "name": "Acme Mobile"\n  }\n}'}
              spellCheck={false}
              value={pastedAppJson}
            />
            {appJsonResult.mode === 'invalid' && (
              <p className="helper-text error">{appJsonResult.error}</p>
            )}
          </div>
        </section>

        {/* Zone 3: Preview + Generate CTA */}
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
              {isGenerating ? 'Generating\u2026' : 'Generate assets'}
            </button>
            {(!uploads.light.upload || !uploads.splash.upload) && (
              <span className="generate-hint">Upload a light icon and light splash first</span>
            )}
          </div>
        </section>

        {/* Zone 4: Results — only shown after generation */}
        {generated && (
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

            {/* Canvas previews */}
            <div className="grid grid--previews">
              <PreviewCanvas blob={generated.previews.iosIcon} label="iOS Icon" />
              <PreviewCanvas blob={generated.previews.androidAdaptive} label="Android Adaptive" />
              <PreviewCanvas blob={generated.previews.splash} label="Splash Screen" />
              <PreviewCanvas blob={generated.previews.tinted} label="Tinted / Mono" />
            </div>

            {/* App.json + Export side by side */}
            <div className="results-grid">

              {/* App.json card */}
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
                    {jsonCopied ? (
                      <>
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
                          <polyline points="2.5 8 6 12 13.5 4" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
                          <rect x="5.5" y="5.5" width="8" height="9" rx="1.5" />
                          <path d="M10 5.5V4A1.5 1.5 0 0 0 8.5 2.5h-4A1.5 1.5 0 0 0 3 4v8A1.5 1.5 0 0 0 4.5 13.5H5.5" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <pre className="appjson-code"><code>{appJsonPreview}</code></pre>
              </div>

              {/* Export panel */}
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
                  {totalAssets} files \u00b7{' '}
                  {platformFilter === 'all'
                    ? 'All platforms'
                    : optionLabel(platformFilter)}
                </p>

                <button
                  className="btn btn--secondary"
                  disabled={isDownloading}
                  onClick={handleDownload}
                  type="button"
                >
                  {isDownloading ? 'Preparing ZIP\u2026' : 'Download ZIP'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Assets Chef &mdash; 100% client-side asset generation &mdash; by <a href="https://github.com/Azula9713" target="_blank" rel="noopener noreferrer">@Azula9713</a></p>
      </footer>
    </>
  )
}

type ThemeToggleProps = {
  onChange: (theme: Theme) => void
  theme: Theme
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
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      </button>
      <button
        aria-label="System theme"
        aria-pressed={theme === 'system'}
        className={`theme-btn${theme === 'system' ? ' theme-btn--active' : ''}`}
        onClick={() => onChange('system')}
        title="System"
        type="button"
      >
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
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
        <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </button>
    </div>
  )
}

export default App
