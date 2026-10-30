---
name: react-bits
description: Search, fetch, and install animated UI components, interactive 3D displays, and backgrounds from the React Bits library (reactbits.dev) via shadcn CLI or direct registry.
---

# React Bits Skill

This skill enables Antigravity to quickly discover and integrate open-source animated React components from [reactbits.dev](https://reactbits.dev).

## Registry Configuration
React Bits is configured in `components.json`:
```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

## Adding Components
Components can be installed via shadcn CLI:
```bash
npx shadcn@latest add @react-bits/<ComponentName>
```
Or directly retrieved from:
- Index of all components: `https://reactbits.dev/llms.txt`
- Component JSON specification: `https://reactbits.dev/r/<ComponentName>.json`

## Popular Components & Categories
- **Showcase / 3D**: `CircularCarousel`, `RollingGallery`, `CardSwap`, `InfiniteMenu`, `CoverFlow`
- **Interactive Controls**: `CometDial`, `OptionWheel`, `LineSidebar`, `GooeyMenu`
- **Backgrounds**: `Aurora`, `Dither`, `Hyperspeed`, `Particles`, `Threads`, `Waves`, `Ballpit`
- **Text & Typography**: `SplitText`, `BlurText`, `ShinyText`, `DecryptedText`, `TrueFocus`, `VariableProximity`
- **Interactive Effects**: `SplashCursor`, `PixelTrail`, `Magnet`, `SpotlightCard`
