# Learnings

- In `packages/frontend`, converting viewport breakpoints to container queries works best when each responsive region declares its own named container. That keeps component behavior tied to available space instead of the overall viewport, which is especially helpful for the explore page's nested panels and the shared header.
