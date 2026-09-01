# pangram badge

paste a public Pangram history link and get a reusable SVG badge which u can use [here](https://pangram-badge.ryanaque.com)

## deploy

import this repo into Vercel, no environment variables or build settings are needed.

badge endpoint:
```text
/api/badge?v=4&url=https%3A%2F%2Fwww.pangram.com%2Fhistory%2F...
```

## test
```sh
npm test
```

verdict percentage and confidence come from Pangram's public history result. if Pangram changes that response format, parser may need updating.

licensed under [MIT](./LICENSE)
