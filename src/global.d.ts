interface State {
  shouldShowLines: boolean
  toggleLineVisibility(): void
}

declare global {
  interface Window {
    state: State
  }
}

export {}
