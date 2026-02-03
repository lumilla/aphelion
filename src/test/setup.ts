import { beforeAll, afterEach } from "vitest";

// Mock DOM APIs not available in jsdom
beforeAll(() => {
  // Mock window.getSelection
  if (!window.getSelection) {
    Object.defineProperty(window, "getSelection", {
      value: () => ({
        removeAllRanges: () => {},
        addRange: () => {},
        getRangeAt: () => ({
          selectNodeContents: () => {},
          collapse: () => {},
        }),
        rangeCount: 0,
      }),
    });
  }

  // Mock document.createRange
  if (!document.createRange) {
    Object.defineProperty(document, "createRange", {
      value: () => ({
        selectNodeContents: () => {},
        collapse: () => {},
        setStart: () => {},
        setEnd: () => {},
      }),
    });
  }
});

afterEach(() => {
  // Clean up DOM after each test
  document.body.innerHTML = "";
});
