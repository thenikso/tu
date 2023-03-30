import { createStream } from './riteway.mjs';

let tests = 0;
let pass = 0;
let fail = 0;
let testTimeLabel;
createStream({ objectMode: true })
  .on('data', (row) => {
    if (!testTimeLabel) {
      testTimeLabel = ' time';
      console.time(testTimeLabel);
    }

    if (row.type === 'test') {
      consoleGroup(`${row.id}: ${row.name}`);
      console.time(`Time test ${row.id}`);
    } else if (row.type === 'end') {
      // console.timeEnd(`Time test ${row.test}`);
      consoleGroupEnd();
    } else {
      tests++;
      if (row.ok) {
        pass++;
        consoleGroupCollapsed(`%c${row.name}`, 'color: #4A9E50');
      } else {
        fail++;
        consoleGroup(`%c${row.name}`, 'color: #DA2D24');
      }
      consoleLog('operator:', row.operator);
      consoleLog('expected:', row.expected);
      consoleLog('  actual:', row.actual);
      if (row.error) {
        consoleError(row.error);
      }
      // consoleLog(row);
      consoleGroupEnd();
    }
  })
  .on('end', () => {
    console.log(
      `%ctests: ${tests}, pass: ${pass}, fail: ${fail}`,
      'font-weight: bold',
    );
    // console.timeEnd(testTimeLabel);
  });

const isNode = typeof window === 'undefined';

let prefix = '';
let collapsed = 0;
const styleMap = {
  'color: #4A9E50': ['\x1b[32m', '\x1b[30m'],
  'color: #DA2D24': ['\x1b[31m', '\x1b[30m'],
};

function format(args) {
  const res = [];
  for (let i = 0, l = args.length; i < l; i++) {
    const a = args[i];
    if (typeof a === 'string' && a.startsWith('%c')) {
      const [s, e] = styleMap[args[++i]];
      res.push(s + a.substr(2) + e);
    } else {
      res.push(a);
    }
  }
  return res.join(' ').replace(/^/gm, prefix);
}

function consoleLog() {
  if (isNode) {
    if (collapsed === 0) {
      console.log(...arguments);
    }
  } else {
    console.log(...arguments);
  }
}

function consoleError() {
  if (isNode) {
    console._stderr.write(format(arguments) + '\n');
  } else {
    console.error(...arguments);
  }
}

function consoleGroup() {
  if (isNode) {
    console._stdout.write('\u001b[1m' + format(arguments) + '\u001b[22m\n');
    prefix += '⎢ ';
  } else {
    console.group(...arguments);
  }
}

function consoleGroupCollapsed() {
  if (isNode) {
    collapsed++;
    console._stdout.write('\u001b[1m' + format(arguments) + '\u001b[22m\n');
    prefix += '⎢ ';
  } else {
    console.groupCollapsed(...arguments);
  }
}

function consoleGroupEnd() {
  if (isNode) {
    if (collapsed > 0) collapsed -= 1;
    prefix = prefix.slice(0, -2);
  } else {
    console.groupEnd();
  }
}
