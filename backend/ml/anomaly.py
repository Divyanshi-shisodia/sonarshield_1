"""
SONARSHIELD - Anomaly / Risk Scoring Engine
==============================================
A transparent, hand-authored scoring formula (NOT a scientifically
validated maritime risk model - explicitly labeled "Prototype Risk
Assessment" everywhere in the UI):

    Risk Score = 40% Detection Confidence
               + 20% Object Area (normalized to image size)
               + 20% Acoustic Shadow Evidence
               + 20% Boundary / Shape Evidence

    0-39   -> LOW
    40-69  -> MEDIUM
    70-100 -> HIGH
"""
import cv2
import numpy as np


def _shadow_evidence(processed_gray: np.ndarray, x, y, w, h):
    """Looks for a darker region trailing the object (classic SSS acoustic
    shadow). Returns a 0..1 score."""
    H, W = processed_gray.shape[:2]
    shadow_h = int(h * 1.4)
    y0 = min(H, y + h)
    y1 = min(H, y0 + shadow_h)
    if y1 <= y0:
        return 0.0
    shadow_region = processed_gray[y0:y1, max(0, x):min(W, x + w)]
    object_region = processed_gray[y:y + h, x:x + w]
    if shadow_region.size == 0 or object_region.size == 0:
        return 0.0
    contrast = float(object_region.mean() - shadow_region.mean())
    return float(np.clip(contrast / 120.0, 0, 1))


def _boundary_evidence(processed_gray: np.ndarray, x, y, w, h):
    """Edge density along the bounding box perimeter via Canny — a sharper,
    more distinct boundary yields a higher score."""
    H, W = processed_gray.shape[:2]
    pad = 3
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(W, x + w + pad), min(H, y + h + pad)
    roi = processed_gray[y0:y1, x0:x1]
    if roi.size == 0:
        return 0.0
    edges = cv2.Canny(roi, 50, 150)
    density = edges.mean() / 255.0
    return float(np.clip(density * 4, 0, 1))


def score_object(processed_gray: np.ndarray, obj: dict):
    x, y, w, h = obj["x"], obj["y"], obj["width"], obj["height"]
    H, W = processed_gray.shape[:2]

    confidence = obj["confidence"]
    area_norm = float(np.clip((w * h) / (W * H * 0.05), 0, 1))
    shadow = _shadow_evidence(processed_gray, x, y, w, h)
    boundary = _boundary_evidence(processed_gray, x, y, w, h)

    score = 100 * (0.40 * confidence + 0.20 * area_norm + 0.20 * shadow + 0.20 * boundary)
    score = round(float(np.clip(score, 0, 100)), 1)

    if score >= 70:
        risk = "HIGH"
    elif score >= 40:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    reasoning = []
    if confidence >= 0.85:
        reasoning.append("High model confidence")
    if area_norm >= 0.5:
        reasoning.append("Significant segmented region / area")
    if shadow >= 0.5:
        reasoning.append("Significant acoustic shadow detected")
    if boundary >= 0.5:
        reasoning.append("Distinct object boundary")
    if confidence >= 0.7 and shadow >= 0.35:
        reasoning.append("Strong acoustic return relative to surrounding seabed")
    if not reasoning:
        reasoning.append("Weak / marginal evidence across indicators")

    return {
        "anomaly_score": score,
        "risk": risk,
        "breakdown": {
            "confidence_component": round(confidence * 40, 1),
            "area_component": round(area_norm * 20, 1),
            "shadow_component": round(shadow * 20, 1),
            "boundary_component": round(boundary * 20, 1),
        },
        "raw_indicators": {
            "confidence": round(confidence, 3),
            "area_norm": round(area_norm, 3),
            "shadow_evidence": round(shadow, 3),
            "boundary_evidence": round(boundary, 3),
        },
        "reasoning": reasoning,
        "label": "Prototype Risk Assessment (not scientifically validated)",
    }
