export type Method = (...args: any[]) => any;

export type Receiver<T = {}> = {
  type: string;
  self: Receiver<T>;
  Receiver: Receiver;
  proto: Receiver;
  protos: Receiver[];
  hasProto: (proto: Receiver) => boolean;
  appendProto: (proto: Receiver) => Receiver<T>;
  prependProto: (proto: Receiver) => Receiver<T>;
  clone: () => Receiver<T>;
  setSlot: <V = any>(name: string, value: V) => V;
  updateSlot: <V = any>(name: string, value: V) => V;
  newSlot: <V = any>(name: string, value: V) => Receiver<T>;
  method: (...args: any[]) => Method;
} & T;

export type Message = {
  name: string;
  arguments: Message[];
  isLiteral: boolean;
  isTerminal: boolean;
  next: Message | null;
  previous: Message | null;
};

export type Call<T> = {
  /**
   * current receiver
   */
  target: Receiver<T>;
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
  sender: Locals<any> | Receiver<any>;
};

export type Locals<T = {}, L extends Record<string, any> = {}> = {
  self: Receiver<T>;
  call: Call<T>;
} & L;

export type ReceiverOwnProps<R> = R extends Receiver<infer P> ? P : never;

// type PropertyDescriptor<T> =
//   | {
//       configurable?: boolean;
//       enumerable?: boolean;
//       value: T;
//       writable?: boolean;
//     }
//   | {
//       configurable?: boolean;
//       enumerable?: boolean;
//       get(): T;
//       set?(v: T): void;
//     };

// type PropertyDescriptorMap<TS extends Record<string, any>> = {
//   [K in keyof TS]: PropertyDescriptor<TS[K]>;
// };

// type createReceiver = <
//   T extends Record<string, any>,
//   P extends Receiver<any>[],
// >(
//   proto: P,
//   descriptors?: PropertyDescriptorMap<T> | {},
// ) => Receiver<T>;

export type Environment = {};
