export interface IReactWebComponent<TProp = any> extends Partial<Function> {
  readonly mountPoint: HTMLElement;
  readonly defaults?: TProp;
  readonly computedProps?: Partial<TProp>;
  onInit?: () => void;
  onDestroy?: () => void;
  attributeChanged?: (name: string, oldValue: unknown, newValue: unknown) => void;
}
