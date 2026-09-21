const setMethods = {
  difference(other) {
    return new Set([...this].filter((value) => !other.has(value)));
  },
  intersection(other) {
    return new Set([...this].filter((value) => other.has(value)));
  },
  union(other) {
    return new Set([...this, ...other]);
  },
  symmetricDifference(other) {
    return new Set([...this].filter((value) => !other.has(value)).concat([...other].filter((value) => !this.has(value))));
  },
  isSubsetOf(other) {
    return [...this].every((value) => other.has(value));
  },
  isSupersetOf(other) {
    return [...other].every((value) => this.has(value));
  },
  isDisjointFrom(other) {
    return ![...this].some((value) => other.has(value));
  },
};

for (const [name, implementation] of Object.entries(setMethods)) {
  if (!Set.prototype[name]) {
    Object.defineProperty(Set.prototype, name, {
      configurable: true,
      value: implementation,
      writable: true,
    });
  }
}

await import(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url));
