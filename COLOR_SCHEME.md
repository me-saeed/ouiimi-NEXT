# Color Scheme - MERN App Match

This document shows the exact color mapping from the MERN base app to the Next.js project.

## Color Palette

| Color Name | Hex Code | HSL Values | Usage |
|------------|----------|------------|-------|
| **Primary** | `#77dd77` | `120 60% 67%` | Main brand color (green) |
| **Secondary** | `#FF8439` | `23 100% 61%` | Secondary brand color (orange) |
| **Button** | `#FF8439` | `23 100% 61%` | Button text color (same as secondary) |
| **Black** | `#2C2D28` | `72 6% 17%` | Text color |
| **Background** | `#F8F8F8` | `0 0% 97%` | Page background |
| **Gray** | `#858585` | `0 0% 52%` | Muted text color |

## Implementation

### Tailwind Config
The colors are available as:
- `color-primary` → `#77dd77`
- `color-secondary` → `#FF8439`
- `color-btn` → `#FF8439`
- `color-black` → `#2C2D28`
- `color-bg` → `#F8F8F8`
- `color-gray` → `#858585`

### CSS Variables
The colors are mapped to CSS variables in `app/globals.css`:
- `--primary` → `120 60% 67%` (Primary green)
- `--secondary` → `23 100% 61%` (Secondary orange)
- `--background` → `0 0% 97%` (Background)
- `--foreground` → `72 6% 17%` (Text)
- `--muted-foreground` → `0 0% 52%` (Gray text)

### Utility Classes
MERN app utility classes are available:
- `.btn-styl` - Button style matching MERN app
- `.input-styl` - Input style matching MERN app
- `.btncolor` - Button text color (#FF8439)
- `.orgcolor` - Primary text color (#77dd77)
- `.bg-primary` - Primary background (#77dd77)
- `.orgback` - Primary background (#77dd77)
- `.shadow-styl` - MERN app shadow style
- `.btn-shadow` - Button shadow style

## Usage Examples

```tsx
// Using Tailwind classes
<div className="bg-color-primary text-white">Primary Background</div>
<button className="text-color-btn">Button</button>

// Using CSS variables (Shadcn UI)
<Button className="bg-primary text-primary-foreground">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>

// Using MERN utility classes
<button className="btn-styl">MERN Style Button</button>
<input className="input-styl" />
```

## Dynamic Color System

The color scheme is also available through the dynamic color system in `lib/colors.ts`:

```typescript
import { getColorScheme, applyColorScheme } from "@/lib/colors";

// Get color scheme
const colors = getColorScheme("default");

// Apply color scheme dynamically
applyColorScheme(colors);
```

## Verification

To verify the colors match the MERN app:
1. Compare hex values in `tailwind.config.ts`
2. Check HSL conversions in `app/globals.css`
3. Test UI components to ensure visual match

