import { dValue, dType } from './util.js';

const SEQUENCE_VALUE = Symbol('value');

export function sequenceInstaller() {
  return {
    install(Lobby) {
      const SEQUENCE_DESCRIPTORS = {
        ...dType('Sequence'),
        clone: {
          value: function Sequence_clone() {
            const value = this[SEQUENCE_VALUE] ?? '';
            const newSequece = Object.create(
              Lobby.Receiver,
              SEQUENCE_DESCRIPTORS,
            );
            if (Array.isArray(value)) {
              newSequece[SEQUENCE_VALUE] = [...value];
            } else {
              newSequece[SEQUENCE_VALUE] = value;
            }
            return newSequece;
          },
        },
        appendSeq: {
          value: function Sequence_appendSeq(seq) {
            const value = this[SEQUENCE_VALUE];
            if (Array.isArray(value)) {
              value.push(...seq);
            } else {
              this[SEQUENCE_VALUE] = value + seq;
            }
            return this;
          },
        },
        asString: {
          value: function Sequence_asString() {
            const value = this[SEQUENCE_VALUE];
            if (Array.isArray(value)) {
              return value.join('');
            }
            return String(value);
          },
        },
        '==': {
          value: function Sequence_equals(other) {
            const value = this[SEQUENCE_VALUE];
            return value === other;
          },
        },
      };
      const Sequence = Object.create(Lobby.Receiver, SEQUENCE_DESCRIPTORS);
      Object.defineProperty(Lobby.Core, 'Sequence', dValue(Sequence));

      return Lobby;
    },
  };
}
