## Moving to Deno

Removed eslint and prettier and their configs.  Needed to ignore any explicit any's.  Cleaned up some unused variables.

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