# pangram badge
[![pangram: 100% human, low confidence](https://pangram-badge.ryanaque.com/api/badge?v=4&url=https%3A%2F%2Fwww.pangram.com%2Fhistory%2Ffa670872-0920-4ac5-a1d7-f2db0c3dd658%3Fucc%3D8YMatFMs9ac)](https://www.pangram.com/history/fa670872-0920-4ac5-a1d7-f2db0c3dd658?ucc=8YMatFMs9ac)

paste a public Pangram history link and get a reusable SVG badge which u can use 
[here](https://pangram-badge.ryanaque.com)

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
