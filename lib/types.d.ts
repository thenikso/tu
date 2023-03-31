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
  arguments: Message[];
  isLiteral: boolean;
  isTerminal: boolean;
  next: Message | null;
  previous: Message | null;
};

export type Method = (...args: any[]) => any;

export type Call<T extends Receiver, S extends Receiver> = {
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
  sender: Locals<S, any> | S;
};

export type Locals<
  T extends Receiver,
  S extends Receiver,
  L extends Record<string, any> = {},
> = {
  self: T;
  call: Call<T, S>;
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
  P extends Receiver<any, any>[],
  T extends Record<string, any>,
>(
  protos: P,
  descriptors?: PropertyDescriptorMap<T> | {},
) => Receiver<P, T>;

//
// Environment
//

export type EnvironmentPlugin = {
  install: <R extends Receiver>(Lobby: R | null, options?: any) => R;
  secure: (Lobby: Receiver, options?: any) => void;
};

export type Environment = {};
