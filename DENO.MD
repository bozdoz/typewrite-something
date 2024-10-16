## Moving to Deno

Removed eslint and prettier and their configs. Needed to ignore any explicit any's. Cleaned up some unused variables.

Can't really move to `deno test`, as my tests are too reliant on jest.

## Deno Build

Had to create a build.ts, but it seems successful at removing rollup; which meant I could remove ~15 packages.

Created a watch mode for the build.ts script without much fuss at all.  `deno run --watch` only watches the script and modules that you call directly, so I had to use the runtime API to use `Deno.watchFs`; it had a problem where it ran modify events three times in a row, so I also imported a recommended debounce script from the std library (versionless because we're all insane: https://jsr.io/@std/async/doc/debounce).

## Benchmarks

```
npm ci
32s

npm run lint
4s

npm test
slow tests
20s
```

```
deno lint
0.3s


```
