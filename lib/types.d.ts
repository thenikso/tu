export type Receiver<
  Protos extends any[] = [],
  Props extends Record<string, any> = {},
> = {
  type: string;
  self: Receiver<Protos, Props>;
  proto: Protos[0];
  protos: Protos;
  hasProto: (proto: Receiver) => boolean;
  appendProto: (proto: Receiver) => Receiver<Protos, Props>;
  prependProto: (proto: Receiver) => Receiver<Protos, Props>;
  clone: () => Receiver<[Receiver<Protos, Props>], {}>;
  setSlot: <V = any>(name: string, value: V) => V;
  updateSlot: <V = any>(name: string, value: V) => V;
  newSlot: <N extends string, V = any>(
    name: N,
    value: V,
  ) => Receiver<Protos, Props & { [key in N]: V }>;
  method: (...args: any[]) => Method;
  toString: () => string;
  doMessage: (message: Message) => Promise<any>;
} & ExtendProtos<Protos> &
  Props;

type RecOwnProps<R> = R extends Receiver<any, infer P> ? P : never;
type ExtendProtos<Protos extends Receiver<any, any>[]> = Protos extends [
  infer Head,
  ...infer Tail,
]
  ? (Head extends Receiver<infer HeadProtos, infer HeadProps>
      ? HeadProps & ExtendProtos<HeadProtos>
      : {}) &
      ExtendProtos<Tail>
  : {};

export type Message = {
  name: string;
  setName: (name: string) => Message;
  arguments: Message[];
  setArguments: (args: Message[]) => Message;
  isLiteral: boolean;
  isEndOfLine: boolean;
  characterNumber: number;
  lineNumber: number;
  next: Message | null;
  setNext: (message: Message | null) => Message;
  previous: Message | null;
  setPrevious: (message: Message | null) => Message;
  doInContext: <T extends Receiver>(context: T, locals?: Locals<any, T>) => Promise<any>;
} & Receiver;

export type Method = (...args: any[]) => any;

export type Call<T extends Receiver> = {
  /**
   * current receiver
   */
  target: T;
  /**
   * the activated method/block
   */
  activated: Method;
  /**
   * message used to call this method/block
   */
  message: Message;
  /**
   * locals object of caller
   */
  // sender: Locals<S, any> | S;
  sender: any;
  /**
   * Evaluate the argument at the given index in the sender's context.
   */
  evalArgAt: (index: number) => Promise<any>;
};

export type Locals<
  L extends Record<string, any> = {},
  T extends Receiver = Receiver,
> = {
  self: T;
  call: Call<T>;
} & L;

type PropertyDescriptor<T> =
  | {
      configurable?: boolean;
      enumerable?: boolean;
      value: T;
      writable?: boolean;
    }
  | {
      configurable?: boolean;
      enumerable?: boolean;
      get(): T;
      set?(v: T): void;
    };

type PropertyDescriptorMap<TS extends Record<string, any>> = {
  [K in keyof TS]: PropertyDescriptor<TS[K]>;
};

type createReceiver = <
  P extends Receiver[] | Receiver,
  T extends Record<string, any>,
>(
  protos: P,
  descriptors?: PropertyDescriptorMap<T> | {},
) => Receiver<P extends Receiver[] ? P : [P], T>;

//
// Environment
//

export type EnvironmentPlugin<R extends Receiver = any> = {
  install: (Lobby: R, options?: any) => R;
  secure?: (Lobby: R, options?: any) => void;
};

export type Environment = {};
