# Lodash vs native JavaScript

Measured with the suites in `lodash-lab/src/lib/benchmarks.js`. Each suite runs a Lodash function and a plain-JavaScript function on the same generated users; **a test checks they return the same result**, so only speed differs. Each side gets warm-up runs, then the **median** of 11 runs is reported (one slow run from garbage collection should not decide the answer). Node 20.20, `npm run bench`. Your machine will differ; the shape of the results is what matters.

## 10,000 users

| Suite | Lodash (ms) | Native (ms) | Faster |
|---|---:|---:|---|
| groupBy department | 0.36 | 0.28 | native 1.3x |
| sort by salary | 3.02 | 1.46 | native 2.1x |
| sort by department, then salary (desc) | 4.36 | 2.13 | native 2.0x |
| filter then map | 0.10 | 0.14 | Lodash 1.4x |
| unique cities | 0.23 | 0.26 | Lodash 1.1x |
| count per country | 0.51 | 0.32 | native 1.6x |
| total salary | 0.08 | 0.06 | native 1.3x |
| all skills in one list | 0.45 | 3.28 | Lodash 7.2x |
| pages of 50 | 0.03 | 0.02 | native 1.9x |
| safe deep read (address.geo.lat) | 0.99 | 0.15 | native 6.5x |
| deep copy (cloneDeep vs structuredClone) | 39.23 | 43.18 | Lodash 1.1x |
| deep compare two copies (isEqual vs JSON.stringify) | 31.69 | 36.46 | Lodash 1.2x |

## 50,000 users

| Suite | Lodash (ms) | Native (ms) | Faster |
|---|---:|---:|---|
| groupBy department | 2.87 | 1.63 | native 1.8x |
| sort by salary | 21.75 | 9.40 | native 2.3x |
| sort by department, then salary (desc) | 29.17 | 13.66 | native 2.1x |
| filter then map | 1.01 | 2.36 | Lodash 2.4x |
| unique cities | 1.55 | 1.73 | Lodash 1.1x |
| count per country | 3.09 | 1.76 | native 1.8x |
| total salary | 1.13 | 1.18 | tie |
| all skills in one list | 6.08 | 19.83 | Lodash 3.3x |
| pages of 50 | 0.14 | 0.03 | native 5.2x |
| safe deep read | 5.24 | 2.63 | native 2.0x |

(Deep copy and deep compare are skipped above 20,000 users: they take seconds.)

## What the numbers say

1. **For simple array work, native is as fast or faster in most rows** (sorting about 2x, grouping and counting 1.3 to 1.8x). Modern engines optimise `sort`, `reduce` and `slice` heavily; Lodash adds a layer (shorthand handling, argument checks).
2. **Lodash can win where native is slow.** `flatMap` over 10,000 arrays was 3 to 7x faster in Lodash on this Node version; `filter` then `map` was also ahead. This depends on the engine version, so re-measure before relying on it.
3. **The gaps are small in absolute terms.** The slowest sort here is 4 ms for 10,000 rows, far below one frame. Speed alone rarely justifies either choice at this size.
4. **`cloneDeep` and `structuredClone` are about equal.** Choose by behaviour: `structuredClone` handles Dates, Maps, Sets and cycles and is built in; `cloneDeep` also copies class instances and keeps functions as-is by reference rather than throwing (`structuredClone` throws on functions). `JSON.parse(JSON.stringify(x))` is a third option but drops `undefined`, turns Dates into strings and fails on cycles.
5. **`get` is slower than `?.` (2 to 6x)** because it parses the path string on every call. Use `?.` for fixed paths in hot loops and `get` when the path is data (form field names).

## When each wins

| Need | Pick | Why |
|---|---|---|
| Debounce, throttle | **Lodash** | No native version; `cancel`, `flush`, `leading`, `trailing`, `maxWait` are easy to get wrong by hand |
| Deep-merge nested defaults | **Lodash** `merge` | Spread replaces nested objects whole (the Methods tab shows the lost `notifications.email`) |
| Read or write a path held in a string | **Lodash** `get`, `set` | No native equivalent for `set`; `get` handles `'a.b[0].c'` |
| `omit` a nested path | **Lodash** | Native needs a manual deep copy |
| Group, count, sum, mean by key | either | Lodash is shorter; native `reduce` is a little faster |
| Sort a list | **Native** for one key, **Lodash `orderBy`** for several keys and directions | `orderBy(users, ['dept','salary'], ['asc','desc'])` vs a hand-written comparator |
| Deep copy | **Native** `structuredClone` | Built in, same speed, more types |
| Dedupe a flat list | **Native** `[...new Set(x)]` | Shortest and fast |
| Sort text for a language | **Native** `Intl.Collator` | Lodash compares with `<`, ignoring locale rules |
| Bundle size matters | **Native**, or per-method / `lodash-es` imports | `import _ from 'lodash'` costs 28 kB gzipped; `lodash/debounce` 1.6 kB |

## Bundle cost of the import style

| Import style | Minified | Gzipped |
|---|---:|---:|
| `import _ from 'lodash'` | 101.1 kB | 28.2 kB |
| `import { debounce } from 'lodash'` | 100.5 kB | 28.0 kB |
| `import debounce from 'lodash/debounce'` | 4.6 kB | 1.6 kB |
| `import { debounce } from 'lodash-es'` | 3.3 kB | 1.3 kB |

## Conclusion

Use native JavaScript by default for plain array and copy work. Reach for Lodash when it removes real complexity: debounce and throttle, deep merge, string paths, nested `omit`, and multi-key `orderBy`. Always import per method (or from `lodash-es`) so the 28 kB whole-library cost is never paid. DataDesk follows that rule and still imports 68 methods because it is a Lodash demonstration; a production app would use far fewer.

## Limits of this comparison

One machine, one Node version, synthetic data with 8 departments and 8 countries. Browser engines differ from Node. Micro-benchmarks do not predict real page speed.
