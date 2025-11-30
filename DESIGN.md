# CHIO - Design System

Complete guide for customizing the visual design of CHIO.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Component Styles](#component-styles)
4. [Layout Structure](#layout-structure)
5. [Icons](#icons)
6. [Customization Guide](#customization-guide)

---

## Color Palette

### Brand Colors

**Location:** `frontend/tailwind.config.js`

```javascript
brand: {
  50: '#e8f5e9',   // Lightest - hover states
  100: '#c8e6c9',  // Very light backgrounds
  200: '#a5d6a7',  // Light backgrounds
  300: '#81c784',  // Borders
  400: '#66bb6a',  // Secondary text
  500: '#4a9d6e',  // Primary brand color (main green)
  600: '#3d7c5f',  // Darker brand
  700: '#2d5a3d',  // Even darker
  800: '#1a4d3a',  // Very dark
  900: '#0d2818',  // Darkest green
}
```

**Used in:**
- Auth layout background image with dark green accents
- Buttons and interactive elements
- Focus states

### Grayscale (Slate)

**Uses Tailwind's default slate colors:**
- `slate-50` to `slate-950`

**Key uses:**
- `slate-950` - Main background (dark theme)
- `slate-900` - Secondary backgrounds, cards
- `slate-600` - Secondary text
- `slate-100` - Light backgrounds (auth page)

### Semantic Colors

**Success (Emerald):**
- `emerald-200` - Text
- `emerald-300` - Light text
- `emerald-400` - Progress bars
- `emerald-500/20` - Badge backgrounds
- Used for completed tasks and positive metrics

**Error (Rose):**
- `rose-200` - Error text on dark
- `rose-400` - Progress bars
- `rose-500/20` - Badge backgrounds
- `rose-600` - Error text on light
- Used for errors, skipped tasks

**Warning (Amber):**
- `amber-200` - Text
- `amber-500/20` - Badge backgrounds
- Reserved for future warning states

---

## Typography

### Font Family

**Primary Font:** Inter (Variable font preferred)

**Location:** `frontend/tailwind.config.js`

```javascript
fontFamily: {
  sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
}
```

**Fallback Stack:**
1. Inter Variable (if loaded)
2. Inter
3. system-ui
4. sans-serif

### Font Sizes & Weights

**Key text styles:**
- Headers: `text-2xl font-semibold` (24px, 600 weight)
- Subheaders: `text-xl font-semibold` (20px, 600 weight)
- Body: `text-base` (16px, 400 weight)
- Small: `text-sm` (14px)
- Extra small: `text-xs` (12px)
- Uppercase labels: `text-xs uppercase tracking-[0.3em]`

### Font Loading

**Location:** `frontend/src/style.css`

```css
:root {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

## Component Styles

### Buttons

**Location:** `frontend/src/components/ui/Button.tsx`

**Variants:**

1. **Primary** (default):
   - Background: `bg-white`
   - Text: `text-slate-900`
   - Hover: `hover:bg-white/90`

2. **Outline**:
   - Border: `border border-white/30`
   - Text: `text-white`
   - Hover: `hover:border-white/70`

3. **Ghost**:
   - Text: `text-white/70`
   - Hover: `hover:text-white hover:bg-white/10`

4. **Danger**:
   - Background: `bg-rose-500`
   - Text: `text-white`
   - Hover: `hover:bg-rose-400`

**Common styles:**
- Border radius: `rounded-2xl` (16px)
- Padding: `px-4 py-2`
- Font: `text-sm font-semibold`

### Cards

**Common pattern:**
```css
rounded-3xl border border-white/10 bg-white/5 p-5
```

**Variants:**
- Dark cards: `bg-slate-900`
- Glass effect: `bg-white/5 backdrop-blur`
- Error cards: `border-rose-500/30 bg-rose-500/10`

### Inputs

**Location:** `frontend/src/components/ui/Input.tsx`

```css
rounded-2xl border border-white/20 bg-white/5 px-4 py-3
focus:border-white focus:bg-white/10
```

### Badges

**Location:** `frontend/src/components/ui/Badge.tsx`

**Tones:**
- Neutral: `bg-white/10 text-white`
- Success: `bg-emerald-500/20 text-emerald-200`
- Danger: `bg-rose-500/20 text-rose-200`
- Warning: `bg-amber-500/20 text-amber-200`

**Style:**
- Border radius: `rounded-full`
- Padding: `px-3 py-1`
- Font: `text-xs font-semibold uppercase tracking-wide`

### Modals

**Location:** `frontend/src/components/ui/Modal.tsx`

**Backdrop:**
```css
bg-slate-950/70 backdrop-blur
```

**Modal card:**
```css
rounded-3xl border border-white/10 bg-slate-900/90 p-6
```

---

## Layout Structure

### App Layout

**Location:** `frontend/src/layouts/AppLayout.tsx`

**Structure:**
1. **Header** - User greeting, app title, logout
   - Background: `bg-white/5`
   - Border: `border-white/10`
   - Rounded: `rounded-3xl`

2. **Navigation** - Tab-based navigation
   - Active tab: `bg-white text-slate-900 shadow-lg`
   - Inactive tab: `text-white/60 hover:bg-white/10`

3. **Main Content Area** - Pages render here

### Auth Layout

**Location:** `frontend/src/layouts/AuthLayout.tsx`

**Split design:**
1. **Left Panel** (hidden on mobile):
   - Gradient: `from-brand-500 via-indigo-600 to-slate-900`
   - Contains branding and testimonials

2. **Right Panel**:
   - Background: `bg-white`
   - Login/Register forms

---

## Icons

**Library:** Lucide React

**Installation:**
```bash
npm install lucide-react
```

**Icons used:**
- `CalendarDays` - Date picker
- `Plus` - Add new item
- `Check` - Complete action
- `SkipForward` - Skip action
- `RotateCcw` - Reset action
- `Pencil` - Edit action
- `Trash2` - Delete action
- `BarChart3` - Statistics
- `X` - Close/dismiss

**Icon sizing:**
- Small: `h-4 w-4`
- Medium: `h-5 w-5`
- Large: `h-6 w-6`

---

## Customization Guide

### 1. Change Brand Color

**File:** `frontend/tailwind.config.js`

Replace the `brand` color palette with your colors. Generate a palette at:
- https://uicolors.app/create
- https://tailwindshades.com/

```javascript
colors: {
  brand: {
    500: '#YOUR_PRIMARY_COLOR', // Start here
    // Generate other shades...
  }
}
```

### 2. Change Background Color/Theme

**Main dark background:**
- `frontend/src/layouts/AppLayout.tsx` - Change `bg-slate-950`
- `frontend/src/layouts/AuthLayout.tsx` - Left panel gradient

**Cards and surfaces:**
- Find `bg-white/5` and `bg-slate-900` throughout components
- Adjust opacity values for glass effects

### 3. Change Logo

**Current:** Text-based "TF" logo

**Location:** `frontend/src/layouts/AuthLayout.tsx` (line 34-36)

```tsx
<span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
  TF
</span>
```

**To add image logo:**
```tsx
<img src="/logo.svg" alt="CHIO" className="h-10 w-10" />
```

### 4. Change Font

**File:** `frontend/tailwind.config.js`

```javascript
fontFamily: {
  sans: ['Your Font', 'system-ui', 'sans-serif'],
}
```

**Remember to:**
1. Import font in `index.html` or `style.css`
2. Update fallback stack

### 5. Add Background Images

**Suggested locations:**
- Auth page left panel
- Empty states in task list
- Behind login form

**Example for auth page:**

```tsx
// In AuthLayout.tsx
<div className="relative ... bg-cover bg-center" style={{ backgroundImage: 'url(/path/to/image.jpg)' }}>
  {/* Overlay to preserve readability */}
  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/90 to-slate-900/90" />
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

### 6. Adjust Spacing

**Global spacing:**
- Container max-width: `max-w-6xl` (AppLayout.tsx)
- Page padding: `px-4 sm:px-6 lg:px-8`
- Section gaps: `space-y-6` or `gap-6`

**Card spacing:**
- Standard padding: `p-6`
- Compact: `p-4`
- Spacious: `p-8` or `p-10`

### 7. Modify Border Radius

**Current system:**
- Buttons/inputs: `rounded-2xl` (16px)
- Cards: `rounded-3xl` (24px)
- Badges: `rounded-full`

**To change globally:**

```javascript
// tailwind.config.js
theme: {
  extend: {
    borderRadius: {
      'card': '20px', // Custom card radius
      'button': '12px', // Custom button radius
    }
  }
}
```

Then replace `rounded-3xl` with `rounded-card` in components.

---

## Shadow System

**Custom shadow:**

```javascript
// tailwind.config.js
boxShadow: {
  card: '0 20px 45px -20px rgba(15, 23, 42, 0.4)',
}
```

**Usage:** `shadow-card` on task cards

**Other shadows:**
- Active tab: `shadow-lg` (built-in Tailwind)
- Modals: Default browser shadow + backdrop blur

---

## Animation & Transitions

**Hover transitions:**
```css
transition hover:-translate-y-1
```

**Loading spinner:**
```tsx
<svg className="animate-spin h-5 w-5" ...>
```

**Fade animations:**
- Add with Tailwind: `transition-opacity duration-300`

---

## Accessibility

**Focus states:**
- All interactive elements have `focus:outline-none focus:ring-2 focus:ring-white/50`
- Or `focus-visible:outline`

**ARIA labels:**
- Added to buttons and navigation
- `role` attributes on landmarks
- `aria-current` for active nav items

**Color contrast:**
- Text on dark: white with opacity for hierarchy
- Text on light: slate shades
- All combinations meet WCAG AA standards

---

## Quick Reference

**Commonly edited files:**
1. `frontend/tailwind.config.js` - Colors, fonts, spacing
2. `frontend/src/components/ui/*` - Component styles
3. `frontend/src/layouts/*` - Page structure and backgrounds
4. `frontend/src/pages/*` - Page-specific content and layout

**Color replacement checklist:**
- [ ] Brand colors in tailwind.config.js
- [ ] Auth page gradient
- [ ] Button primary color
- [ ] Badge colors
- [ ] Focus ring colors

**Logo replacement checklist:**
- [ ] Update AuthLayout.tsx logo
- [ ] Add favicon in `public/`
- [ ] Update page title in `index.html`

