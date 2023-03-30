export type Receiver = {
  self: Receiver;
  Receiver: Receiver;
  proto: Receiver;
  protos: Receiver[];
  hasProto: (proto: Receiver) => boolean;
}

export type Environment = {}