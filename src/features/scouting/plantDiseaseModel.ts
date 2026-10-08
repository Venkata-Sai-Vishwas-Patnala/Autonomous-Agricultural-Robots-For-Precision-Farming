import { plantVillageLabels } from './plantVillageLabels'

const MODEL_URL = 'https://huggingface.co/AbhiCommits/cropguard-models/resolve/main/cropguard.static-int8.onnx'
const TEMPERATURE = 0.5908
const INPUT_SIZE = 224
const channelMeans = [0.485, 0.456, 0.406]
const channelStdDevs = [0.229, 0.224, 0.225]

export type PlantPrediction = {
  label: string
  confidence: number
}

let sessionPromise: Promise<import('onnxruntime-web').InferenceSession> | undefined

function getSession() {
  sessionPromise ??= import('onnxruntime-web').then((ort) => ort.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] }))
  return sessionPromise
}

function preprocess(image: ImageBitmap, ort: typeof import('onnxruntime-web')) {
  const scale = 256 / Math.min(image.width, image.height)
  const scaledWidth = image.width * scale
  const scaledHeight = image.height * scale
  const sourceX = (scaledWidth - INPUT_SIZE) / (2 * scale)
  const sourceY = (scaledHeight - INPUT_SIZE) / (2 * scale)
  const sourceSize = INPUT_SIZE / scale
  const canvas = document.createElement('canvas')
  canvas.width = INPUT_SIZE
  canvas.height = INPUT_SIZE
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('The browser could not prepare this image for the model.')
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, INPUT_SIZE, INPUT_SIZE)
  const pixels = context.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data
  const planeSize = INPUT_SIZE * INPUT_SIZE
  const values = new Float32Array(planeSize * 3)
  for (let pixel = 0; pixel < planeSize; pixel += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value = pixels[pixel * 4 + channel] / 255
      values[channel * planeSize + pixel] = (value - channelMeans[channel]) / channelStdDevs[channel]
    }
  }
  return new ort.Tensor('float32', values, [1, 3, INPUT_SIZE, INPUT_SIZE])
}

export async function analyzePlantLeaf(file: Blob): Promise<PlantPrediction[]> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a JPEG, PNG, or other browser-readable image.')
  const image = await createImageBitmap(file)
  try {
    const ort = await import('onnxruntime-web')
    const session = await getSession()
    const input = preprocess(image, ort)
    const outputMap = await session.run({ [session.inputNames[0]]: input })
    const output = outputMap[session.outputNames[0]]
    const logits = Array.from(output.data as Float32Array)
    if (logits.length !== plantVillageLabels.length) {
      throw new Error(`Model returned ${logits.length} classes; expected ${plantVillageLabels.length}.`)
    }
    const scaled = logits.map((value) => value / TEMPERATURE)
    const maximum = Math.max(...scaled)
    const exponents = scaled.map((value) => Math.exp(value - maximum))
    const denominator = exponents.reduce((total, value) => total + value, 0)
    return exponents
      .map((value, index) => ({ label: plantVillageLabels[index], confidence: value / denominator }))
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 3)
  } finally {
    image.close()
  }
}

export const plantDiseaseModelInfo = {
  name: 'CropGuard ResNet50 · quantized ONNX',
  dataset: 'PlantVillage, 54,305 leaf images · 14 crops · 38 classes',
  modelUrl: MODEL_URL,
  firstRunDownload: '23.8 MB weights + ONNX Web runtime',
  limitation: 'Trained and evaluated on detached leaves with plain backgrounds; field-photo accuracy is not established.',
}