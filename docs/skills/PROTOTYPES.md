# Bubbleverse dev-only prototype guide

Project-authored replacement for the missing PICKER.md/RECIPES material. Only use when
the user requested variants or an assigned task explicitly authorizes a prototype.

Choose one component and normally two or three distinct directions (layout, density or
interaction), not three accent colors. Use current tokens and realistic synthetic copy.

Keep the surface under an explicitly dev-only route or isolated local harness. No
production component imports from it, and no auth bypass against a real service. Any
mocked data/actions are visibly test data; interactions work locally without paid calls.

The neutral picker has labeled buttons, visible focus, a keyboard path, a current-variant
indicator and instant switching. Render one variant at realistic size with its surrounding
context. Do not rely on tiny side-by-side thumbnails to choose readable typography.

Verify all variants in both languages, Reduced Motion and relevant widths. Report what
was actually rendered and any browser/device limits. The owner selects the direction;
promote only that authorized variant. Remove the harness afterward unless retention was
requested. Never publish synthetic success as a real customer purchase or generated book.
