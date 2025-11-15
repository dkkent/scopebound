# Scopebound Design Guidelines

## Design Approach
**System-Based Approach** drawing from Linear and Notion's clean, productivity-focused aesthetics. These systems excel at complex multi-tenant workflows while maintaining clarity and speed.

## Core Design Principles
1. **Clarity First**: Every element serves a functional purpose
2. **Spatial Efficiency**: Information-dense without clutter
3. **Fast Interactions**: Minimal friction in authentication and navigation flows
4. **Hierarchy Through Structure**: Use spacing and typography, not color

---

## Typography System
- **Primary Font**: Inter (Google Fonts)
- **Hierarchy**:
  - H1: text-4xl font-semibold (landing hero)
  - H2: text-2xl font-semibold (page titles)
  - H3: text-lg font-medium (section headers)
  - Body: text-base (forms, content)
  - Small: text-sm (labels, helper text)
  - Micro: text-xs (timestamps, metadata)

---

## Layout System
**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** exclusively
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Page margins: px-6, py-8

**Grid Structure**:
- Max container width: max-w-7xl mx-auto
- Form containers: max-w-md mx-auto
- Dashboard content: Full width with px-6 padding

---

## Component Library

### Landing Page
**Layout**: Single-page centered design
- **Hero Section** (min-h-screen flex items-center):
  - Centered content (max-w-3xl)
  - App name + tagline (H1 + text-xl)
  - Two CTAs: "Get Started" (primary) + "Sign In" (secondary)
  - Simple feature bullets below (3 items, text-lg)
- **No hero image** - keep it clean and focused on the CTA

### Authentication Forms
**Container**: Centered card (max-w-md, p-8, rounded-lg, border)
- Form title (H2)
- Input fields with consistent spacing (space-y-4)
- Labels above inputs (text-sm font-medium mb-2)
- Full-width inputs (w-full, px-4, py-2, rounded-md, border)
- Error messages (text-sm, mt-1)
- Submit button (w-full, py-2.5, rounded-md, font-medium)
- Secondary actions below (text-sm, centered)

### Dashboard Shell
**Structure**: Two-column layout
- **Sidebar** (w-64, fixed left):
  - Logo/org name at top (p-6)
  - Organization switcher (dropdown, mb-6)
  - Navigation items (vertical list, px-4, py-2, rounded-md)
  - User profile at bottom (p-4, border-t)
- **Main Content** (ml-64, full height):
  - Header bar (border-b, px-6, py-4): Page title + actions
  - Content area (px-6, py-8)

### Organization Switcher
**Component**: Dropdown button
- Current org name + chevron icon
- Hover state: subtle background change
- Dropdown menu: List of orgs + "Create Organization" option
- Each org item shows name + member count (text-xs)

### Navigation Items
- Icon + label (horizontal layout, gap-3)
- Active state: distinct background, font-medium
- Hover: subtle background
- Consistent height (h-10)

---

## Key Interactions

**Form Validation**:
- Inline validation on blur
- Error state: border accent + error message below
- Success: Remove error state, no green indicators

**Loading States**:
- Button: Disable + loading spinner (small, inline)
- Page transitions: No full-page spinners for SaaS feel

**Empty States** (Dashboard):
- Centered content (max-w-md mx-auto, text-center)
- Icon placeholder
- Heading + description
- Primary CTA to take action

---

## Accessibility Requirements
- All form inputs have associated labels
- Focus states: visible outline on all interactive elements
- Keyboard navigation: Tab through forms logically
- ARIA labels for icon-only buttons
- Minimum contrast ratios maintained throughout

---

## Images
**No images required** for this application foundation. Focus on clean typography and structure. Future iterations may add:
- Organization logos (32x32 avatars in switcher)
- User profile pictures (40x40 rounded-full)
- Empty state illustrations (optional enhancement)