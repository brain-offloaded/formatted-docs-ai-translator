declare module 'fitty' {
  interface FittyOptions {
    minSize?: number;
    maxSize?: number;
    multiLine?: boolean;
    observeMutations?: boolean;
  }

  interface FittyInstance {
    element: HTMLElement;
    fit(): void;
    unsubscribe(): void;
    freeze(): void;
    unfreeze(): void;
  }

  function fitty(
    target: string | HTMLElement | HTMLElement[],
    options?: FittyOptions
  ): FittyInstance | FittyInstance[];

  export = fitty;
}
