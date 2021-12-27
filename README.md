# `before-shutdown`
> Execute an async handler before the Node.js process exits

```js
import { beforeShutdown } from "before-shutdown";
import { setTimeout } from "timers/promises";

// calls the provided function prior to exiting
const unregister = beforeShutdown(async () => {
  // your async operation here
  console.log("Cleaning up...")
  await setTimeout(1000);
});

unregister(); // removes the hook
```

## Supported exit methods:
- `process.exit()`
- thrown exception
- getting to the end of the program
- ctrl-c/signals