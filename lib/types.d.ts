export type Receiver<T = {}> = {
  self: Receiver<T>;
  Receiver: Receiver;
  proto: Receiver;
  protos: Receiver[];
  hasProto: (proto: Receiver) => boolean;
  appendProto: (proto: Receiver) => Receiver<T>;
  prependProto: (proto: Receiver) => Receiver<T>;
} & T;

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
