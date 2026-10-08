# Crop Model and Measurement Limits

## Leaf disease screening

The crop-analysis screen loads the public CropGuard quantized ONNX checkpoint on the first analysis request (23.8 MB) and runs it locally with ONNX Runtime Web. Images are processed in the browser and are not uploaded by this disease-analysis path.

The CropGuard checkpoint is published under CC BY-SA 4.0 and was trained on PlantVillage, whose published dataset contains 54,306 controlled leaf images across 14 crop species and 26 diseases. The model card describes a 38-class grouped-leaf holdout and reports its own benchmark metrics; those are publisher-reported results, not measurements of this application.

Sources:


The CropGuard card says the intended images are single detached leaves photographed against a plain background. Its performance on farm scenes, multiple leaves, varied light, and occlusion is not established. PlantDoc is linked as an external field-image dataset for future evaluation; this checkpoint was trained on PlantVillage, not PlantDoc. Treat the output as a screening suggestion, not a diagnosis or treatment prescription.

## Soil images and sensor readings

No soil-image model or documented soil-image training dataset is bundled. Soil-image analysis stays unavailable until `VITE_SOIL_ANALYSIS_API_URL` points to a model endpoint trained and evaluated on an identified soil imagery dataset. RGB images cannot reliably provide soil moisture, pH, electrical conductivity, or nutrient levels. Those measurements require appropriate calibrated probes.

The endpoint receives multipart form data under the `image` field and may return JSON with `summary`, `condition`, and optional `recommendation` properties. The UI labels that result as visual classification and still directs measured values to a soil probe.

## Camera distance

The distance tool uses pinhole-camera scale calibration. Capture a known-width reference at a measured camera distance, mark its two edge points, then capture a target with a known physical width and mark its edges. The estimate is:

`target distance = calibrated focal length in pixels × target width / target pixel width`

This estimate assumes the same camera, lens, zoom, focus, near-frontal target planes, and accurate manual point selection. It is not suitable for collision avoidance, spraying clearance, or safety decisions. Use a calibrated depth camera or LiDAR for operational range.
