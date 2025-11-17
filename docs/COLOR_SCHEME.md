# Color Scheme Documentation

This document outlines the official color palette used throughout the Automation Platform.

## Color Hierarchy

### Primary Colors (Eggplant / Navy)
Primary colors are used for main interactive elements, active states, and primary buttons.

- **Eggplant**: `#4a1d5c` (Light mode primary)
- **Navy**: `#1e3a5f` (Alternative primary)

**Usage:**
- Primary buttons
- Active navigation items
- Selected states
- Focus indicators
- Progress bars

### Secondary Colors (Raspberry / Charcoal / Gray)
Secondary colors are used for supporting elements, secondary buttons, and muted text.

- **Raspberry**: `#c72c6c` (Secondary accent)
- **Charcoal**: `#374151` (Secondary text)
- **Gray**: `#6b7280` (Muted text and borders)

**Usage:**
- Secondary buttons
- Muted/supporting text
- Icons in inactive state
- Borders and dividers
- Secondary UI elements

### Tertiary Colors (Black / White)
Tertiary colors provide the base canvas and primary text.

- **Black**: `#000000` (Text in light mode, background in dark mode)
- **White**: `#ffffff` (Background in light mode, text in dark mode)

**Usage:**
- Page backgrounds
- Card backgrounds
- Primary text color
- High contrast elements

### Accent Color (Core Green)
The accent color is used for success states, confirmations, and highlights.

- **Core Green**: `#00a859` (Light mode)
- **Brightened Green**: `#10b981` (Dark mode)

**Usage:**
- Success messages
- Success rate indicators
- Positive actions
- Confirmation states
- Active/enabled toggles

## CSS Variables

All colors are accessible via CSS custom properties (variables):

```css
/* Primary */
--primary: var(--eggplant)      /* #4a1d5c */
--primary-hover: #3a1549        /* Darker on hover */

/* Secondary */
--secondary: var(--raspberry)   /* #c72c6c */
--gray: #6b7280
--charcoal: #374151

/* Tertiary */
--text: #000000                 /* Light mode */
--bg: #ffffff                   /* Light mode */

/* Accent */
--accent: var(--core-green)     /* #00a859 */
--success: var(--core-green)

/* Semantic */
--warning: #f59e0b
--danger: #dc2626
--border: #e5e7eb
--muted: var(--gray)
```

## Dark Mode Colors

In dark mode, colors are adjusted for better readability:

```css
/* Dark Mode Adjustments */
--eggplant: #7c3a99              /* Lightened */
--raspberry: #e85d8a             /* Lightened */
--core-green: #10b981            /* Brightened */
--text: #ffffff                  /* White text */
--bg: #000000                    /* Black background */
--surface: #1f2937               /* Dark gray for cards */
--border: #374151                /* Darker borders */
```

## Usage Examples

### Buttons

```jsx
// Primary button - Eggplant background
<button style={{ backgroundColor: 'var(--primary)', color: '#FFFFFF' }}>
  Primary Action
</button>

// Secondary button - Raspberry background
<button style={{ backgroundColor: 'var(--secondary)', color: '#FFFFFF' }}>
  Secondary Action
</button>

// Accent button - Core Green background
<button style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}>
  Success Action
</button>
```

### Text

```jsx
// Primary text - Black
<p style={{ color: 'var(--text)' }}>Main content</p>

// Muted text - Gray
<p style={{ color: 'var(--muted)' }}>Supporting text</p>

// Success text - Core Green
<p style={{ color: 'var(--success)' }}>Operation successful!</p>
```

### Surfaces

```jsx
// White background card
<div style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
  Card content
</div>

// Surface background (slightly gray)
<div style={{ backgroundColor: 'var(--surface)' }}>
  Panel content
</div>
```

## Tailwind Configuration

The color scheme is integrated into Tailwind CSS:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        700: '#4a1d5c',  // Base Eggplant
        // ... other shades
      },
      accent: {
        500: '#00a859',  // Core Green
        // ... other shades
      },
    },
  },
}
```

## Accessibility

All color combinations meet WCAG 2.1 AA standards for contrast:

- **Primary text on white background**: 21:1 (AAA)
- **White text on Eggplant**: 8.1:1 (AAA)
- **White text on Raspberry**: 4.8:1 (AA)
- **White text on Core Green**: 3.5:1 (AA Large Text)

## Migration Notes

Previous colors have been replaced:
- Old purple `#4C12A1` → `var(--primary)` (Eggplant)
- Old green `#00a859` → `var(--accent)` (Core Green)
- Old teal `#00c2a0` → Removed
- Old FIS navy → `var(--navy)` (Navy)

All components now use CSS variables for consistent theming across light and dark modes.

---

## Author

**Shinish Sasidharan**

---

**Autoclik v1.0 - Automation Platform**
