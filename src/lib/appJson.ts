type AppJsonOptions = {
  adaptiveIconBackgroundColor: string
  hasDarkIcon: boolean
  splashBackgroundDark: string
  splashBackgroundLight: string
}

type JsonArray = JsonValue[]

type JsonObject = {
  [key: string]: JsonValue
}

type JsonValue =
  | boolean
  | JsonArray
  | JsonObject
  | null
  | number
  | string

type MergeAppJsonResult =
  | {
      mode: 'generated'
      text: string
    }
  | {
      mode: 'merged'
      text: string
    }
  | {
      error: string
      mode: 'invalid'
      text: string
    }

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cloneJsonValue<T extends JsonValue>(value: T): T {
  return structuredClone(value) as T
}

function deepMergeJson(base: JsonObject, patch: JsonObject): JsonObject {
  const merged: JsonObject = { ...base }

  for (const [key, patchValue] of Object.entries(patch)) {
    const baseValue = merged[key]

    if (isJsonObject(baseValue) && isJsonObject(patchValue)) {
      merged[key] = deepMergeJson(baseValue, patchValue)
      continue
    }

    merged[key] = cloneJsonValue(patchValue)
  }

  return merged
}

function getPluginName(plugin: JsonValue | undefined) {
  if (typeof plugin === 'string') {
    return plugin
  }

  if (
    Array.isArray(plugin) &&
    plugin.length > 0 &&
    typeof plugin[0] === 'string'
  ) {
    return plugin[0]
  }

  return null
}

function mergePlugins(existing: JsonValue | undefined, next: JsonArray) {
  if (!Array.isArray(existing)) {
    return cloneJsonValue(next)
  }

  const replacementByName = new Map(
    next
      .map((plugin) => [getPluginName(plugin), plugin] as const)
      .filter(([name]) => name !== null),
  )
  const consumed = new Set<string>()
  const merged: JsonArray = []

  for (const plugin of existing) {
    const name = getPluginName(plugin)

    if (name && replacementByName.has(name)) {
      if (!consumed.has(name)) {
        merged.push(cloneJsonValue(replacementByName.get(name)!))
        consumed.add(name)
      }

      continue
    }

    merged.push(cloneJsonValue(plugin))
  }

  for (const plugin of next) {
    const name = getPluginName(plugin)

    if (!name || !consumed.has(name)) {
      merged.push(cloneJsonValue(plugin))
    }
  }

  return merged
}

function generateAppJson({
  adaptiveIconBackgroundColor,
  hasDarkIcon,
  splashBackgroundDark,
  splashBackgroundLight,
}: AppJsonOptions) {
  return {
    expo: {
      android: {
        adaptiveIcon: {
          backgroundColor: adaptiveIconBackgroundColor,
          backgroundImage: './android-icon-background.png',
          foregroundImage: './android-icon-foreground.png',
          monochromeImage: './android-icon-monochrome.png',
        },
        icon: './icon.png',
      },
      icon: './icon.png',
      ios: {
        icon: {
          dark: hasDarkIcon ? './icon-dark.png' : './icon.png',
          light: './icon.png',
          tinted: './icon-tinted.png',
        },
      },
      plugins: [
        [
          'expo-splash-screen',
          {
            backgroundColor: splashBackgroundLight,
            dark: {
              backgroundColor: splashBackgroundDark,
              image: './splash-dark.png',
            },
            image: './splash.png',
            imageWidth: 200,
            resizeMode: 'contain',
          },
        ],
      ],
    },
  }
}

export function serializeAppJson(options: AppJsonOptions) {
  return `${JSON.stringify(generateAppJson(options), null, 2)}\n`
}

export function mergeAppJson(
  existingText: string,
  options: AppJsonOptions,
): MergeAppJsonResult {
  const trimmed = existingText.trim()

  if (!trimmed) {
    return {
      mode: 'generated',
      text: serializeAppJson(options),
    }
  }

  let parsed: JsonValue

  try {
    parsed = JSON.parse(existingText) as JsonValue
  } catch {
    return {
      error: 'Paste a valid JSON app.json file to get a merged full file.',
      mode: 'invalid',
      text: serializeAppJson(options),
    }
  }

  if (!isJsonObject(parsed)) {
    return {
      error: 'The pasted config must be a JSON object.',
      mode: 'invalid',
      text: serializeAppJson(options),
    }
  }

  const generated = generateAppJson(options)
  const root = cloneJsonValue(parsed)
  const existingExpo = isJsonObject(root.expo) ? root.expo : root
  const mergedExpo = deepMergeJson(existingExpo, generated.expo)

  mergedExpo.plugins = mergePlugins(existingExpo.plugins, generated.expo.plugins)

  const mergedRoot = isJsonObject(root.expo)
    ? { ...root, expo: mergedExpo }
    : { expo: mergedExpo }

  return {
    mode: 'merged',
    text: `${JSON.stringify(mergedRoot, null, 2)}\n`,
  }
}
