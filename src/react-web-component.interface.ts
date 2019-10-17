export interface IReactWebComponent<TProp = any> extends Partial<Function> {
  readonly mountPoint: HTMLElement;
  readonly defaults?: TProp;
  readonly computedProps?: Partial<TProp>;
  onInit?: () => void;
  onDestroy?: () => void;
  attributeChanged?: (name: string, oldValue: unknown, newValue: unknown) => void;
}

type Merge<A, B> = {
  [K in keyof A]: K extends keyof B ? B[K] : A[K]
} & B;

export type ReactWebComponentWithProps<TProp = any> = Merge<IReactWebComponent<TProp>, Partial<TProp>>;