---
name: tagmesh-design-motion
description: Master Design System and Motion Physics Guidelines for TagMesh. Enforces Apple-grade spatial claymorphism, OKLCH wide-gamut palettes, multi-layered diffuse shadows, and Spring Physics dynamics (stiffness, damping, mass).
---

# 🎨 TagMesh Studio: Design System & Motion Physics Standards

## 1. Design Philosophy
- **Spatial Claymorphism**: Soft, pillowy 3D surfaces with physical tactile presence, inner bevel specular highlights (`inset 0 2px 4px rgba(255,255,255,0.85)`), and multi-layer diffuse ambient shadows.
- **OKLCH Harmony Palette**: Wide-gamut pastel tones with high dynamic range, preventing muddy grays in gradients.
- **Zero-Friction Micro-interactions**: Micro-hover lift (2~4px), spring press (scale: 0.96), and dynamic interactive sound synthesis.

## 2. Palette Tokens
| Theme | Mood & Concept | Primary Flow | Background Lighting | Ambient Accent |
| :--- | :--- | :--- | :--- | :--- |
| **🌸 樱花物语 (Sakura Bloom)** | Warm Healing Sakura | `oklch(0.7 0.22 355) ➔ oklch(0.75 0.18 45)` | `#fff1f3` + Rose Quartz ambient | `rgba(244, 114, 182, 0.4)` |
| **🌌 极光星瀚 (Cosmic Aurora)**| Dreamy Astral Sky | `oklch(0.6 0.25 295) ➔ oklch(0.7 0.2 240)` | `#f3effe` + Lavender Glow | `rgba(168, 85, 247, 0.4)` |
| **🍵 禅意苔原 (Zen Bamboo)**   | Fresh Morning Dew | `oklch(0.68 0.2 155) ➔ oklch(0.78 0.18 120)` | `#effbf6` + Tea Forest Light | `rgba(16, 185, 129, 0.4)` |
| **👑 琥珀盛夏 (Amber Glow)**   | Sunlit Warm Honey | `oklch(0.75 0.2 70) ➔ oklch(0.72 0.22 35)` | `#fef7e8` + Golden Hour Glow | `rgba(245, 158, 11, 0.4)` |
| **🌧️ 烟雨江南 (Rain Mist)**    | Cool Mountain Mist | `oklch(0.7 0.18 215) ➔ oklch(0.65 0.2 250)` | `#f0f7ff` + Cyan Droplet Glow | `rgba(6, 182, 212, 0.4)` |

## 3. Motion Dynamics (Spring Physics)
Use `motion` with authentic mechanical spring parameters:
```tsx
export const SPRING_TOUCH = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8
};

export const SPRING_CARD = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 1.0
};
```
