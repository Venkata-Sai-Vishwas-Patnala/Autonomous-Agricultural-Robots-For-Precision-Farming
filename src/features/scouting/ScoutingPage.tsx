import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { ArrowRight, Camera, CircleAlert, LoaderCircle, RotateCcw, ScanLine, Sprout, Upload, X } from 'lucide-react'
import PageHeading from '../../shared/ui/PageHeading'
import SensorCard from '../../shared/ui/SensorCard'
import { useSensors } from '../../shared/sensors/useSensors'
import { analyzePlantLeaf, plantDiseaseModelInfo, type PlantPrediction } from './plantDiseaseModel'

type AnalysisMode = 'leaf' | 'soil' | 'distance'
type Capture = { file: File; url: string }
type ImagePoint = { x: number; y: number }

const soilAnalysisUrl = import.meta.env.VITE_SOIL_ANALYSIS_API_URL

function formatPlantLabel(label: string) {
  const [crop = '', disease = ''] = label.split('___')
  const clean = (value: string) => value
    .replaceAll('_', ' ')
    .replaceAll(',', ', ')
    .replace(/\s+/g, ' ')
    .trim()
  return { crop: clean(crop), disease: clean(disease) }
}

function ScoutingPage() {
  const [mode, setMode] = useState<AnalysisMode>('leaf')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capture, setCapture] = useState<Capture | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [videoReady, setVideoReady] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictions, setPredictions] = useState<PlantPrediction[] | null>(null)
  const [soilResult, setSoilResult] = useState('')
  const [points, setPoints] = useState<ImagePoint[]>([])
  const [referenceWidth, setReferenceWidth] = useState('5')
  const [referenceDistance, setReferenceDistance] = useState('50')
  const [targetWidth, setTargetWidth] = useState('10')
  const [calibratedFocalPixels, setCalibratedFocalPixels] = useState<number | null>(null)
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const { sensors } = useSensors()
  const soilProbeConnected = sensors['soil-probe'].status === 'connected'

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      void videoRef.current.play()
        .then(() => setVideoReady(videoRef.current?.videoWidth ? true : false))
        .catch(() => setCameraError('Camera preview could not start. Check browser camera permissions.'))
    }
  }, [stream])

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream])
  useEffect(() => () => { if (capture) URL.revokeObjectURL(capture.url) }, [capture])

  const saveCapture = (file: File) => {
    setCapture((previous) => {
      if (previous) URL.revokeObjectURL(previous.url)
      return { file, url: URL.createObjectURL(file) }
    })
    setPoints([])
    setMeasuredDistance(null)
    setPredictions(null)
    setAnalysisError('')
    setSoilResult('')
  }

  const startCamera = async () => {
    setCameraError('')
    setVideoReady(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not expose camera access. Use a current browser on localhost or HTTPS.')
      return
    }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      setStream(nextStream)
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Camera permission was not granted.')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
  }

  const captureFrame = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) saveCapture(new File([blob], `field-capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) saveCapture(file)
    event.target.value = ''
  }

  const analyzeLeaf = async () => {
    if (!capture) return
    setIsAnalyzing(true)
    setAnalysisError('')
    setPredictions(null)
    try {
      setPredictions(await analyzePlantLeaf(capture.file))
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'The crop model could not analyze this image.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const analyzeSoil = async () => {
    if (!capture) return
    if (!soilAnalysisUrl) {
      setAnalysisError('Soil image model is not configured. Set VITE_SOIL_ANALYSIS_API_URL to a model trained and evaluated on a documented soil-image dataset.')
      return
    }
    setIsAnalyzing(true)
    setAnalysisError('')
    setSoilResult('')
    try {
      const formData = new FormData()
      formData.append('image', capture.file)
      const response = await fetch(soilAnalysisUrl, { method: 'POST', body: formData })
      if (!response.ok) throw new Error(`Soil model request failed (${response.status}).`)
      const result = await response.json() as { summary?: string; condition?: string; recommendation?: string }
      setSoilResult(result.summary ?? result.condition ?? 'The soil model returned no condition summary.')
      if (result.recommendation) setSoilResult(`${result.summary ?? result.condition ?? 'Result'} — ${result.recommendation}`)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'The configured soil model could not analyze this image.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const markImage = (event: MouseEvent<HTMLDivElement>) => {
    const image = imageRef.current
    if (!image) return
    const bounds = image.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
    setPoints((current) => current.length === 2 ? [{ x, y }] : [...current, { x, y }])
    setMeasuredDistance(null)
  }

  const pixelSpan = () => {
    const image = imageRef.current
    if (!image || points.length !== 2) return 0
    const dx = (points[0].x - points[1].x) * image.naturalWidth
    const dy = (points[0].y - points[1].y) * image.naturalHeight
    return Math.hypot(dx, dy)
  }

  const saveCalibration = () => {
    const span = pixelSpan()
    const width = Number(referenceWidth)
    const distance = Number(referenceDistance)
    if (span > 0 && width > 0 && distance > 0) {
      setCalibratedFocalPixels(span * distance / width)
      setPoints([])
      setCapture((previous) => {
        if (previous) URL.revokeObjectURL(previous.url)
        return null
      })
    }
  }

  const calculateDistance = () => {
    const span = pixelSpan()
    const width = Number(targetWidth)
    if (calibratedFocalPixels && span > 0 && width > 0) {
      setMeasuredDistance(calibratedFocalPixels * width / span)
    }
  }

  const clearCapture = () => {
    setCapture((previous) => {
      if (previous) URL.revokeObjectURL(previous.url)
      return null
    })
    setPredictions(null)
    setSoilResult('')
    setPoints([])
    setAnalysisError('')
  }

  const isDistance = mode === 'distance'
  const modeDescription = mode === 'leaf'
    ? 'Capture or choose a single leaf photo to screen it with a public, PlantVillage-trained model.'
    : mode === 'soil'
      ? 'Capture soil surface imagery. RGB photos do not measure moisture, pH, or nutrients; those require probes.'
      : 'Estimate camera-to-target distance from a known-size reference captured with the same camera and zoom.'

  return (
    <div className="page-stack">
      <PageHeading eyebrow="Field intelligence" title="Crop camera analysis" description={modeDescription} action={<span className="mini-tag scouting-mode"><Camera size={13} /> Camera permission required</span>} />

      <div className="analysis-mode-tabs" role="group" aria-label="Camera analysis mode">
        <button type="button" className={mode === 'leaf' ? 'selected' : ''} onClick={() => setMode('leaf')}><Sprout size={15} /> Leaf disease</button>
        <button type="button" className={mode === 'soil' ? 'selected' : ''} onClick={() => setMode('soil')}><ScanLine size={15} /> Soil surface</button>
        <button type="button" className={mode === 'distance' ? 'selected' : ''} onClick={() => setMode('distance')}><CircleAlert size={15} /> Distance</button>
      </div>

      {mode === 'leaf' && <div className="notice-banner model-caveat"><span className="notice-symbol"><CircleAlert size={16} /></span><span><strong>Research screening only.</strong> This public model is trained on detached leaves with plain backgrounds; field-photo performance is not established. Confirm findings with a qualified agronomist.</span></div>}

      <div className="analysis-layout">
        <section className="panel camera-panel">
          <div className="panel-heading"><div><p className="panel-kicker">{mode === 'leaf' ? 'LEAF IMAGE' : mode === 'soil' ? 'SOIL SURFACE IMAGE' : isDistance ? calibratedFocalPixels ? 'CALIBRATED MEASUREMENT' : 'CAMERA DISTANCE' : 'CAMERA INPUT'}</p><h2>{capture ? capture.file.name : 'Camera capture'}</h2></div>{capture && <button className="icon-button" type="button" aria-label="Clear selected photo" onClick={clearCapture}><X size={16} /></button>}</div>
          <div className={`camera-stage ${capture ? 'has-capture' : ''}`}>
            {capture ? <div className={`captured-image-wrap ${isDistance ? 'can-mark-points' : ''}`} onClick={isDistance ? markImage : undefined}>
              <img ref={imageRef} className="captured-image" src={capture.url} alt="Selected field capture" />
              {isDistance && points.map((point, index) => <span key={index} className="image-measure-point" style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />)}
              {isDistance && points.length === 2 && <svg className="image-measure-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1={points[0].x * 100} y1={points[0].y * 100} x2={points[1].x * 100} y2={points[1].y * 100} /></svg>}
            </div> : stream ? <video ref={videoRef} className="camera-video" autoPlay playsInline muted aria-label="Live camera preview" /> : <div className="camera-placeholder"><span><Camera size={25} /></span><strong>Camera is off</strong><small>Allow camera access to capture an image, or choose a photo.</small></div>}
          </div>
          {cameraError && <p className="inline-error" role="alert">{cameraError}</p>}
          {analysisError && <p className="inline-error" role="alert">{analysisError}</p>}
          <div className="camera-controls">
            {stream ? <><button className="button button-primary" type="button" disabled={!videoReady} onClick={captureFrame}><Camera size={15} /> Take photo</button><button className="button button-subtle" type="button" onClick={stopCamera}>Stop camera</button></> : <button className="button button-primary" type="button" onClick={() => void startCamera()}><Camera size={15} /> Access camera</button>}
            <button className="button button-subtle" type="button" onClick={() => fileInputRef.current?.click()}><Upload size={15} /> Choose photo</button>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={handleFile} />
          </div>
          {isDistance && capture && <div className="image-instruction">Click two points on the reference or target edge in the image. Selected points: {points.length}/2.</div>}
        </section>

        <aside className="analysis-side-panel">
          {mode === 'leaf' && <section className="panel model-panel"><p className="panel-kicker">LOCAL IMAGE MODEL</p><h2>{plantDiseaseModelInfo.name}</h2><p>Dataset: {plantDiseaseModelInfo.dataset}. The model runs in this browser; the image is not uploaded.</p><div className="model-meta"><span>First use loads {plantDiseaseModelInfo.firstRunDownload}</span><span>38 PlantVillage labels</span></div><button className="button button-primary analyze-button" type="button" disabled={!capture || isAnalyzing} onClick={() => void analyzeLeaf()}>{isAnalyzing ? <><LoaderCircle size={15} className="spin-icon" /> Loading model / analyzing…</> : <><ScanLine size={15} /> Analyze leaf</>}</button><div className="dataset-links"><a href="https://github.com/spMohanty/PlantVillage-Dataset" target="_blank" rel="noreferrer">PlantVillage dataset <ArrowRight size={12} /></a><a href="https://github.com/pratikkayal/PlantDoc-Dataset" target="_blank" rel="noreferrer">PlantDoc field-image dataset <ArrowRight size={12} /></a></div></section>}

          {mode === 'soil' && <><section className="panel model-panel"><p className="panel-kicker">SOIL IMAGE MODEL</p><h2>{soilAnalysisUrl ? 'Configured soil analysis service' : 'Soil model not connected'}</h2><p>{soilAnalysisUrl ? 'The configured endpoint will receive this photo for visual soil-surface analysis.' : 'No verified soil-image classifier is configured. Add VITE_SOIL_ANALYSIS_API_URL to connect a soil model trained and evaluated on documented soil imagery.'}</p><button className="button button-primary analyze-button" type="button" disabled={!capture || isAnalyzing || !soilAnalysisUrl} onClick={() => void analyzeSoil()}>{isAnalyzing ? <><LoaderCircle size={15} className="spin-icon" /> Analyzing…</> : <><ScanLine size={15} /> Analyze soil image</>}</button></section><div className="sensor-requirement"><p className="panel-kicker">MEASURED SOIL VALUES</p><p>{soilProbeConnected ? 'Soil probe connected. Use its readings for moisture and conductivity; the image model only classifies surface appearance.' : 'Camera images cannot reliably measure soil moisture, pH, or electrical conductivity. Connect a soil probe to access measured values.'}</p><SensorCard sensorId="soil-probe" /></div></>}

          {mode === 'distance' && <section className="panel distance-panel"><p className="panel-kicker">SCALE-BASED CAMERA MEASUREMENT</p><h2>{calibratedFocalPixels ? 'Camera calibrated' : 'Calibrate this camera'}</h2>{!calibratedFocalPixels ? <><p>Photograph a known-size reference at a measured distance. Use the same camera and zoom for the target photo.</p><div className="distance-inputs"><label>Reference width (cm)<input type="number" min="0.1" step="any" value={referenceWidth} onChange={(event) => setReferenceWidth(event.target.value)} /></label><label>Camera-to-reference (cm)<input type="number" min="1" step="any" value={referenceDistance} onChange={(event) => setReferenceDistance(event.target.value)} /></label></div><button className="button button-primary analyze-button" type="button" disabled={!capture || points.length !== 2} onClick={saveCalibration}>Save camera calibration</button></> : <><p>Enter the physical width of the target, photograph it, and mark its left and right edges.</p><div className="distance-inputs single-input"><label>Target width (cm)<input type="number" min="0.1" step="any" value={targetWidth} onChange={(event) => setTargetWidth(event.target.value)} /></label></div><button className="button button-primary analyze-button" type="button" disabled={!capture || points.length !== 2} onClick={calculateDistance}>Calculate distance</button>{measuredDistance !== null && <div className="distance-result"><span>Estimated camera-to-target distance</span><strong>{measuredDistance >= 100 ? `${(measuredDistance / 100).toFixed(2)} m` : `${measuredDistance.toFixed(1)} cm`}</strong></div>}<button className="text-action recalibrate-action" type="button" onClick={() => { setCalibratedFocalPixels(null); setPoints([]); setMeasuredDistance(null) }}><RotateCcw size={13} /> Recalibrate camera</button></>}<div className="measurement-caveat">Approximate pinhole-camera estimate only. Requires a rigid reference and target edge facing the camera; lens distortion, perspective, focus, and measurement errors affect accuracy. For robot safety or spray clearance, connect a calibrated depth camera/LiDAR instead.</div></section>}
        </aside>
      </div>

      {mode === 'leaf' && predictions && <section className="panel prediction-panel" aria-live="polite"><div className="panel-heading"><div><p className="panel-kicker">PLANTVILLAGE CLASSIFIER · IN-BROWSER</p><h2>Screening result</h2></div><span className="result-caveat">Not a confirmed diagnosis</span></div><div className="prediction-list">{predictions.map((prediction, index) => { const { crop, disease } = formatPlantLabel(prediction.label); return <div className={`prediction-row ${index === 0 ? 'top-prediction' : ''}`} key={prediction.label}><span className="prediction-rank">{index + 1}</span><div className="prediction-name"><strong>{disease}</strong><span>{crop}</span></div><div className="prediction-score"><strong>{(prediction.confidence * 100).toFixed(1)}%</strong><span>calibrated model score</span></div></div> })}</div><div className="recommendation-note"><span className="recommendation-icon"><Sprout size={17} /></span><div><strong>Next step</strong><p>{formatPlantLabel(predictions[0].label).disease.toLowerCase() === 'healthy' ? 'The model matched a healthy-leaf class. Continue routine scouting and compare several plants; this does not rule out disease.' : 'Photograph additional leaves and seek local agronomy confirmation before treatment. Do not make chemical or irrigation decisions from this image result alone.'}</p></div></div></section>}

      {mode === 'soil' && soilResult && <section className="panel soil-result-panel"><p className="panel-kicker">CONFIGURED MODEL RESPONSE</p><h2>{soilResult}</h2><p>Visual soil classification only. Confirm moisture, pH, and nutrient readings with field instruments.</p></section>}
      {mode === 'distance' && <SensorCard sensorId="depth-camera" />}
    </div>
  )
}

export default ScoutingPage