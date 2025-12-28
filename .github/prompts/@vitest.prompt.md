---
description: 'Best practices for writing Vue 3 tests using Vitest and TypeScript, including vi mocking, component testing, and Pinia/Router patterns.'
agent: '@main'
---

# Copilot Prompt: Vitest + Vue 3 + TypeScript — Monorepo Best Practices

## General Guidelines

- Use TypeScript 5.x, ES2024, Vue 3 (Composition API).
- Test files should be placed in `tests/` directories or next to the component, named `<feature>.spec.ts`.
- For components, follow the AAA pattern: Arrange, Act, Assert.
- Group tests using `describe` blocks for features, components, or functions.

## Tooling

- Core: `@vue/test-utils`, `@testing-library/vue`, `@testing-library/user-event`, `vitest`, `vi`.
- Pinia: Use `createTestingPinia({ stubActions: false })` for store mocking and action tracking.
- Router: Mock using `global.plugins` or manual mocks if the component depends on `$route`/`$router`.

## Test Structure Example

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
// ...import component and dependencies...

describe('MyComponent.vue', () => {
  beforeEach(() => {
    // ...setup...
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  it('should ...', async () => {
    // Arrange
    const wrapper = mount(MyComponent, {
      /* ...props, plugins... */
    });
    // Act
    await wrapper.trigger('click');
    // Assert
    expect(wrapper.text()).toContain('...');
  });
});
```

## Mocking & Async

- Use `vi.mock()` for modules, `vi.fn()` for functions, and `vi.spyOn()` for methods.
- Always reset mocks with `vi.clearAllMocks()` in `afterEach`.
- For async actions, use `await nextTick()` and `flushPromises()`.
- For timers, use `vi.useFakeTimers()` and `vi.advanceTimersByTime(ms)`.

## User-centric Testing

- For interactions, use `@testing-library/vue` and `user-event`.
- Always check accessibility: roles, aria attributes, focus, tab order.

## Pinia & Router

- Pinia: Use `createTestingPinia({ stubActions: false })` for store state and action tracking.
- Router: Mock via `global.plugins` or manually if the component relies on `$route`/`$router`.

## Vitest Matchers

| Category      | Matcher                                            |
| ------------- | -------------------------------------------------- |
| Basic         | expect(val).toBe(), expect(obj).toEqual()          |
| Truthiness    | expect(val).toBeTruthy(), expect(val).toBeNull()   |
| Existence     | expect(wrapper.find('.el').exists()).toBe(true)    |
| Classes/Attrs | expect(wrapper.classes()).toContain('active')      |
| Emitted       | expect(wrapper.emitted()).toHaveProperty('submit') |
| Mocks         | expect(viFn).toHaveBeenCalledWith(...)             |
| Async         | await expect(promise).resolves.toMatch('data')     |
| Errors        | await expect(asyncFn).rejects.toThrow('error msg') |
| Snapshots     | expect(wrapper.html()).toMatchSnapshot()           |

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://vue-test-utils.vuejs.org/)
- [Testing Library Vue](https://testing-library.com/docs/vue-testing-library/intro/)
- [Pinia Testing](https://pinia.vuejs.org/cookbook/testing.html)
- [Vue Router Testing](https://router.vuejs.org/guide/advanced/testing.html)

## Summary

Follow these best practices to write effective, maintainable tests for Vue 3 applications using Vitest and TypeScript. Focus on user-centric testing, proper mocking, and leveraging Vitest's powerful features to ensure robust test coverage.
