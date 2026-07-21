'use client';

import { Collapsible as CollapsiblePrimitive } from 'radix-ui';

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

/**
 * Height animation via the grid-rows 0fr→1fr wrapper (docs/motion.md). NB: this
 * still animates layout every frame (same rendering cost class as tweening
 * `height`) — it is NOT compositor-cheap; it's simply the only CSS-only way to
 * animate to auto height, and the cost is acceptable for occasional reveals.
 * Don't copy the pattern for high-frequency motion. `forceMount` keeps this node
 * permanently in the DOM/unhidden so Radix's own JS height measurement never
 * races the CSS transition; the inner `overflow-hidden` div clips content while
 * the row track is collapsed.
 */
function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      forceMount
      // Fixed, never merged with `className` — a consumer's own layout classes
      // (flex, mt-2, …) belong on the inner content wrapper below. Merging
      // them here let a bare `flex` clobber `grid` and silently kill the
      // row-track animation (display must stay `grid` for grid-rows to do
      // anything).
      className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-quiet data-[state=open]:grid-rows-[1fr]"
      {...props}
    >
      {/* `overflow-hidden` alone (no margin/padding of its own) is what gives
          this item an automatic minimum size of 0 for grid track sizing —
          any spacing a consumer passes via `className` has to live one level
          further in, or its margin leaks past the 0fr collapse. */}
      <div className="overflow-hidden">
        <div className={className}>{children}</div>
      </div>
    </CollapsiblePrimitive.CollapsibleContent>
  );
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
