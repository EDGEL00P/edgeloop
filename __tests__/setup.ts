import "@testing-library/jest-dom";

beforeEach(() => {
  vi.clearAllMocks();
});

global.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
};
