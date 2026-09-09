# shared/

Code imported by **both** `client/` and `server/`.

Validation schemas live here so a rule is defined exactly once. IDEA.md §32.16
requires validating on both sides; keeping two copies of each rule guarantees
they drift, and in this app the rules being validated are financial (split
totals, percentages, amounts) where drift means wrong money.

**Constraints for anything placed here:** plain JavaScript, no Node built-ins,
no browser globals, and no dependency that is not installed in both packages.
Currently that means `zod` and nothing else.

## How each side imports it

```js
// server — a normal relative import
import { registerSchema } from '../../../shared/validators/auth.js';

// client — via the @shared alias configured in client/vite.config.js
import { registerSchema } from '@shared/validators/auth.js';
```
