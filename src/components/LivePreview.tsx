type LivePreviewProps = {
  adaptiveBg: string
  bgDark: string
  bgLight: string
  iconDark?: string
  iconLight?: string
  splashDark?: string
  splashLight?: string
}

const EmptyIcon = () => (
  <div className="lp-empty-frame">
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" height="24">
      <rect x="3" y="3" width="18" height="18" rx="4" />
    </svg>
    <span>No icon</span>
  </div>
)

const EmptySplash = () => (
  <div className="lp-empty-frame">
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24" height="24">
      <rect x="5" y="2" width="14" height="20" rx="3" />
    </svg>
    <span>No artwork</span>
  </div>
)

export function LivePreview({
  adaptiveBg,
  bgLight,
  bgDark,
  iconLight,
  iconDark,
  splashLight,
  splashDark,
}: Readonly<LivePreviewProps>) {
  const darkIconSrc = iconDark ?? iconLight
  const lightSplashArt = splashLight
  const darkSplashArt = splashDark ?? splashLight

  return (
    <div className="live-preview">
      <div className="lp-mocks">
        <div className="lp-mock">
          <div className="lp-icon-frame">
            {iconLight
              ? <img alt="Light icon" className="lp-icon-img" src={iconLight} />
              : <EmptyIcon />}
          </div>
          <span className="lp-mock-label">Icon · Light</span>
        </div>

        <div className="lp-mock">
          <div className="lp-icon-frame lp-icon-frame--dark">
            {darkIconSrc
              ? <img alt="Dark icon" className="lp-icon-img" src={darkIconSrc} />
              : <EmptyIcon />}
          </div>
          <span className="lp-mock-label">Icon · Dark</span>
        </div>

        <div className="lp-mock">
          <div
            className="lp-android-frame"
            style={{ backgroundColor: adaptiveBg }}
          >
            {iconLight
              ? <img alt="Android adaptive icon" className="lp-android-img" src={iconLight} />
              : <EmptyIcon />}
          </div>
          <span className="lp-mock-label">Android · Adaptive</span>
        </div>

        <div className="lp-mock">
          <div
            className="lp-splash-frame"
            style={lightSplashArt ? { backgroundColor: bgLight } : undefined}
          >
            {lightSplashArt
              ? <img alt="Light splash" className="lp-splash-img" src={lightSplashArt} />
              : <EmptySplash />}
          </div>
          <span className="lp-mock-label">Splash · Light</span>
        </div>

        <div className="lp-mock">
          <div
            className="lp-splash-frame"
            style={darkSplashArt ? { backgroundColor: bgDark } : undefined}
          >
            {darkSplashArt
              ? <img alt="Dark splash" className="lp-splash-img" src={darkSplashArt} />
              : <EmptySplash />}
          </div>
          <span className="lp-mock-label">Splash · Dark</span>
        </div>
      </div>
    </div>
  )
}
