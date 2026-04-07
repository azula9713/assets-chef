import { serializeAppJson } from './appJson'
import {
  compositeOnBackground,
  containImage,
  createSolidImage,
  grayscaleImage,
  resizeImage,
} from './imageProcessor'
import type { AssetEntry, GeneratedAssets, UserInputs } from './types'

const IOS_ICON_SPECS = [
  { filename: 'icon-20@2x.png', idiom: 'iphone', pixels: 40, scale: '2x', size: '20x20' },
  { filename: 'icon-20@3x.png', idiom: 'iphone', pixels: 60, scale: '3x', size: '20x20' },
  { filename: 'icon-29@2x.png', idiom: 'iphone', pixels: 58, scale: '2x', size: '29x29' },
  { filename: 'icon-29@3x.png', idiom: 'iphone', pixels: 87, scale: '3x', size: '29x29' },
  { filename: 'icon-40@2x.png', idiom: 'iphone', pixels: 80, scale: '2x', size: '40x40' },
  { filename: 'icon-40@3x.png', idiom: 'iphone', pixels: 120, scale: '3x', size: '40x40' },
  { filename: 'icon-60@2x.png', idiom: 'iphone', pixels: 120, scale: '2x', size: '60x60' },
  { filename: 'icon-60@3x.png', idiom: 'iphone', pixels: 180, scale: '3x', size: '60x60' },
  { filename: 'icon-20.png', idiom: 'ipad', pixels: 20, scale: '1x', size: '20x20' },
  { filename: 'icon-20@2x-ipad.png', idiom: 'ipad', pixels: 40, scale: '2x', size: '20x20' },
  { filename: 'icon-29.png', idiom: 'ipad', pixels: 29, scale: '1x', size: '29x29' },
  { filename: 'icon-29@2x-ipad.png', idiom: 'ipad', pixels: 58, scale: '2x', size: '29x29' },
  { filename: 'icon-40.png', idiom: 'ipad', pixels: 40, scale: '1x', size: '40x40' },
  { filename: 'icon-40@2x-ipad.png', idiom: 'ipad', pixels: 80, scale: '2x', size: '40x40' },
  { filename: 'icon-76.png', idiom: 'ipad', pixels: 76, scale: '1x', size: '76x76' },
  { filename: 'icon-76@2x.png', idiom: 'ipad', pixels: 152, scale: '2x', size: '76x76' },
  { filename: 'icon-83.5@2x.png', idiom: 'ipad', pixels: 167, scale: '2x', size: '83.5x83.5' },
  {
    filename: 'icon-app-store-1024.png',
    idiom: 'ios-marketing',
    pixels: 1024,
    scale: '1x',
    size: '1024x1024',
  },
] as const

const ANDROID_DENSITIES = [
  { folder: 'mipmap-mdpi', pixels: 48 },
  { folder: 'mipmap-hdpi', pixels: 72 },
  { folder: 'mipmap-xhdpi', pixels: 96 },
  { folder: 'mipmap-xxhdpi', pixels: 144 },
  { folder: 'mipmap-xxxhdpi', pixels: 192 },
] as const

const WEB_ICON_SPECS = [
  { filename: 'favicon-16x16.png', pixels: 16 },
  { filename: 'favicon-32x32.png', pixels: 32 },
  { filename: 'apple-touch-icon.png', pixels: 180 },
  { filename: 'android-chrome-192x192.png', pixels: 192 },
  { filename: 'android-chrome-512x512.png', pixels: 512 },
] as const

const ANDROID_ADAPTIVE_SAFE_RATIO = 66 / 108
const SPLASH_ICON_CONTAIN_RATIO = 0.52

function jsonBlob(value: unknown) {
  return new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: 'application/json',
  })
}

function textBlob(value: string, type = 'application/json') {
  return new Blob([value], { type })
}

async function buildIco(entries: Array<{ blob: Blob; pixels: number }>) {
  const buffers = await Promise.all(entries.map(async ({ blob }) => blob.arrayBuffer()))
  const headerSize = 6 + entries.length * 16
  const totalSize = headerSize + buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
  const output = new ArrayBuffer(totalSize)
  const view = new DataView(output)
  const bytes = new Uint8Array(output)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, entries.length, true)

  let offset = headerSize

  entries.forEach(({ pixels }, index) => {
    const buffer = buffers[index]
    const entryOffset = 6 + index * 16
    const sizeByte = pixels >= 256 ? 0 : pixels

    view.setUint8(entryOffset, sizeByte)
    view.setUint8(entryOffset + 1, sizeByte)
    view.setUint8(entryOffset + 2, 0)
    view.setUint8(entryOffset + 3, 0)
    view.setUint16(entryOffset + 4, 1, true)
    view.setUint16(entryOffset + 6, 32, true)
    view.setUint32(entryOffset + 8, buffer.byteLength, true)
    view.setUint32(entryOffset + 12, offset, true)

    bytes.set(new Uint8Array(buffer), offset)
    offset += buffer.byteLength
  })

  return new Blob([output], { type: 'image/x-icon' })
}

function generateIosContentsJson() {
  return {
    images: IOS_ICON_SPECS.map(({ filename, idiom, scale, size }) => ({
      filename,
      idiom,
      scale,
      size,
    })),
    info: {
      author: 'assets-chef',
      version: 1,
    },
  }
}

function fallbackManifestName(value: string, fallback: string) {
  return value.trim() || fallback
}

function generateSiteManifest(
  backgroundColor: string,
  appName: string,
  appShortName: string,
) {
  const resolvedAppName = fallbackManifestName(
    appName,
    'TODO_REPLACE_WITH_APP_NAME',
  )
  const resolvedShortName = fallbackManifestName(
    appShortName,
    'TODO_REPLACE_WITH_SHORT_NAME',
  )

  return {
    background_color: backgroundColor,
    display: 'standalone',
    icons: [
      {
        sizes: '192x192',
        src: './android-chrome-192x192.png',
        type: 'image/png',
      },
      {
        sizes: '512x512',
        src: './android-chrome-512x512.png',
        type: 'image/png',
      },
    ],
    name: resolvedAppName,
    short_name: resolvedShortName,
    theme_color: backgroundColor,
  }
}

export function serializeSiteManifest(
  backgroundColor: string,
  appName: string,
  appShortName: string,
) {
  return `${JSON.stringify(
    generateSiteManifest(backgroundColor, appName, appShortName),
    null,
    2,
  )}\n`
}

function withPath(filename: string, blob: Blob): AssetEntry {
  return { blob, filename }
}

async function createSplashAsset(
  source: Blob,
  useContainPadding: boolean,
  width: number,
  height: number,
) {
  if (useContainPadding) {
    return containImage(source, {
      containRatio: SPLASH_ICON_CONTAIN_RATIO,
      height: 1024,
      width: 1024,
    })
  }

  return resizeImage(source, width, height)
}

export async function generateAssets(inputs: UserInputs): Promise<GeneratedAssets> {
  const lightSource = inputs.lightIcon.file
  const darkSource = inputs.darkIcon?.file ?? inputs.lightIcon.file
  const splashLightAsset = inputs.splashImage
  const splashDarkAsset = inputs.splashImageDark ?? inputs.splashImage
  const splashLightSource = splashLightAsset.file
  const splashDarkSource = splashDarkAsset.file

  const expoIcon = await resizeImage(lightSource, 1024, 1024)
  const expoDarkIcon = await resizeImage(darkSource, 1024, 1024)
  const expoTintedIcon = await grayscaleImage(expoIcon)
  const adaptiveBackground = await createSolidImage(
    1024,
    1024,
    inputs.adaptiveIconBackgroundColor,
  )
  const [adaptiveForeground, adaptiveMonochrome, splashLight, splashDark] = await Promise.all([
    containImage(expoIcon, {
      containRatio: ANDROID_ADAPTIVE_SAFE_RATIO,
      height: 1024,
      width: 1024,
    }),
    containImage(expoTintedIcon, {
      containRatio: ANDROID_ADAPTIVE_SAFE_RATIO,
      height: 1024,
      width: 1024,
    }),
    createSplashAsset(
      splashLightSource,
      false,
      splashLightAsset.width,
      splashLightAsset.height,
    ),
    createSplashAsset(
      splashDarkSource,
      !inputs.splashImageDark,
      splashDarkAsset.width,
      splashDarkAsset.height,
    ),
  ])

  const androidAdaptivePreview = await compositeOnBackground(adaptiveForeground, {
    backgroundColor: inputs.adaptiveIconBackgroundColor,
    containRatio: 1,
    height: 1024,
    width: 1024,
  })
  const splashPreview = await compositeOnBackground(splashLight, {
    backgroundColor: inputs.splashBackgroundLight,
    containRatio: 1,
    height: 2048,
    width: 2048,
  })

  const iosAssets = await Promise.all(
    IOS_ICON_SPECS.map(async ({ filename, pixels }) =>
      withPath(
        `AppIcon.appiconset/${filename}`,
        await resizeImage(lightSource, pixels, pixels),
      ),
    ),
  )

  iosAssets.push(
    withPath(
      'AppIcon.appiconset/Contents.json',
      jsonBlob(generateIosContentsJson()),
    ),
  )

  const androidAssets = await Promise.all(
    ANDROID_DENSITIES.map(async ({ folder, pixels }) => {
      const safeIcon = await containImage(lightSource, {
        containRatio: ANDROID_ADAPTIVE_SAFE_RATIO,
        height: pixels,
        width: pixels,
      })
      const composed = await compositeOnBackground(safeIcon, {
        backgroundColor: inputs.adaptiveIconBackgroundColor,
        containRatio: 1,
        height: pixels,
        width: pixels,
      })
      return withPath(`${folder}/ic_launcher.png`, composed)
    }),
  )

  const webImages = await Promise.all(
    WEB_ICON_SPECS.map(async ({ filename, pixels }) =>
      withPath(filename, await resizeImage(lightSource, pixels, pixels)),
    ),
  )

  const favicon16 = webImages.find((entry) => entry.filename === 'favicon-16x16.png')
  const favicon32 = webImages.find((entry) => entry.filename === 'favicon-32x32.png')

  if (!favicon16 || !favicon32) {
    throw new Error('Failed to assemble favicon assets.')
  }

  const faviconIco = await buildIco([
    { blob: favicon16.blob, pixels: 16 },
    { blob: favicon32.blob, pixels: 32 },
  ])

  const appJsonText = serializeAppJson({
    adaptiveIconBackgroundColor: inputs.adaptiveIconBackgroundColor,
    hasDarkIcon: Boolean(inputs.darkIcon),
    splashBackgroundDark: inputs.splashBackgroundDark,
    splashBackgroundLight: inputs.splashBackgroundLight,
  })

  const manifest = {
    android: androidAssets,
    expo: [
      withPath('icon.png', expoIcon),
      withPath('icon-dark.png', expoDarkIcon),
      withPath('icon-tinted.png', expoTintedIcon),
      withPath('android-icon.png', expoIcon),
      withPath('adaptive-icon.png', adaptiveForeground),
      withPath('adaptive-icon-background.png', adaptiveBackground),
      withPath('android-icon-foreground.png', adaptiveForeground),
      withPath('android-icon-background.png', adaptiveBackground),
      withPath('adaptive-icon-monochrome.png', adaptiveMonochrome),
      withPath('android-icon-monochrome.png', adaptiveMonochrome),
      withPath('splash.png', splashLight),
      withPath('splash-dark.png', splashDark),
      withPath('app.json', textBlob(appJsonText)),
    ],
    ios: iosAssets,
    web: [
      ...webImages,
      withPath(
        'site.webmanifest',
        textBlob(
          serializeSiteManifest(
            inputs.splashBackgroundLight,
            inputs.appName,
            inputs.appShortName,
          ),
        ),
      ),
      withPath('favicon.ico', faviconIco),
    ],
  }

  return {
    appJsonText,
    manifest,
    previews: {
      androidAdaptive: androidAdaptivePreview,
      iosIcon: expoIcon,
      splash: splashPreview,
      tinted: expoTintedIcon,
    },
  }
}
