## TransitionableReactRouter

100% a WIP, use at own risk.

The router only supports the history API without a hashbang fallback. Does SSR. Allows for transitions by providing these following states to the nested components: `entering`, `entered`, `exiting`, and `exited`.

The main goal was to keep this router lean, without relying on `TransitionGroup`, and while allowing nesting route and allowing for different animations.
