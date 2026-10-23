# Design language

Tokens are defined in frontend style tokens only (frontend/src/styles/tokens.css). Light and dark themes both define every token; never hard-code colours, radii or shadows in components. Widget and motion rules below are the only UI rules beyond AGENTS.md.

## Tokens

Every colour, shadow and surface comes from the tokens. The light theme is the default; the dark theme overrides the same tokens. Functional text always uses the ink and muted tokens; accents are reserved for widget highlights and active states.

## Motion

- Motion is transform and opacity only. Never animate layout, top/left/right or width.
- Tab change animation is direction-aware: a higher tab index slides in from the right, a lower one from the left, over 320 ms. The active indicator glides with a slight overshoot and stretches on long jumps. Reduced motion means a 120 ms crossfade only.
- The money backdrop is static under reduced motion and pauses while the page is hidden. Fewer symbols render on mobile.
- Loading skeletons replace widgets while their data loads; they collapse without layout shift once loaded.

## Widgets

- Home is a widget grid: one column on mobile, two on tablet, three on desktop (guideware/policies.js).
- One component renders every widget. Each widget frame carries an icon, a live summary and a tap target that opens the widget's detail screen.
- Each widget is themed by its role: Quick pay uses the primary, Family Circle the Family teal, Disputes the warning, Balance radar the info, Receive money the success fill, Safety the danger fill, Balance check the navy, Assistant the accent.
- Receive money sits at the bottom of the grid and animates in when scrolled into view.
- Widgets show live data from the backend only. Widgets never decide rules or move money.
