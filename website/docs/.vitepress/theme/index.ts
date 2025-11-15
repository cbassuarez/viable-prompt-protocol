import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './style.css';

const theme: Theme = {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp?.(ctx);

    if (typeof window === 'undefined') {
      return;
    }

    const { router } = ctx;
    const originalAfterRouteChanged = router.onAfterRouteChanged?.bind(router);

    const typesetMath = () => {
      const mathjax = (window as typeof window & { MathJax?: any }).MathJax;

      if (!mathjax) {
        return;
      }

      if (typeof mathjax.typesetClear === 'function') {
        mathjax.typesetClear();
      }

      if (typeof mathjax.typesetPromise === 'function') {
        mathjax.typesetPromise().catch(() => {
          /* swallow MathJax promise errors */
        });
      } else if (typeof mathjax.typeset === 'function') {
        mathjax.typeset();
      }
    };

    const queueTypeset = () => {
      requestAnimationFrame(() => {
        queueMicrotask(typesetMath);
      });
    };

    if (document.readyState === 'complete') {
      queueTypeset();
    } else {
      window.addEventListener('load', queueTypeset, { once: true });
    }

    router.onAfterRouteChanged = (...args) => {
      originalAfterRouteChanged?.(...args);
      queueTypeset();
    };
  }
};

export default theme;
