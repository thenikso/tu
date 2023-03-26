import '../../vendor/tap-console.mjs';
import { describe } from '../../vendor/riteway.mjs';
import { createUtils } from './utils.mjs';

import { environment } from '../try3.mjs';

describe('Tutorial: Math', async (assert) => {
  const { assertReturn } = createUtils(environment, assert);

  assertReturn('1+1', 2);
  assertReturn('1+1 == 2', true);
  assertReturn('2 sqrt', 1.4142135623730951);
});

describe('Tutorial: Variables', async (assert) => {
  const { assertReturn, withEnv } = createUtils(environment, assert);

  withEnv(() => {
    assertReturn('a := 1', 1);
    assertReturn('a', 1);
    assertReturn('b := 2 * 3', 6);
    assertReturn('a + b', 7);
  });
});

describe('Tutorial: ', async (assert) => {
  const { assertReturn, withEnv, assertLogs } = createUtils(
    environment,
    assert,
  );

  withEnv(() => {
    assertLogs(
      `a := 2;
      (a == 1) ifTrue("a is one" println) ifFalse("a is not one" println)`,
      'a is not one',
    );
    assertLogs(
      'if(a == 1, writeln("a is one"), writeln("a is not one"))',
      'a is not one',
    );
  });
});

describe('Tutorial: List', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = createUtils(
    environment,
    assert,
  );

  withEnv(() => {
    assertReturn('d := List clone append(30, 10, 5, 20)', [30, 10, 5, 20]);
    assertReturn('d size', 4);
    assertLogs('d print', 'list(30, 10, 5, 20)');
    assertReturn('d := d sort', [5, 10, 20, 30]);
    assertReturn('d first', 5);
    assertReturn('d last', 30);
    assertReturn('d at(2)', 20);
    assertReturn('d remove(30)', [5, 10, 20]);
    assertReturn('d atPut(1, 123)', [5, 123, 20]);
  });

  assertReturn('list(30, 10, 5, 20) select(>10)', [30, 20]);
  assertReturn('list(30, 10, 5, 20) detect(>10)', 30);
  assertReturn('list(30, 10, 5, 20) map(*2)', [60, 20, 10, 40]);
  assertReturn('list(30, 10, 5, 20) map(v, v*2)', [60, 20, 10, 40]);
});

describe('Tutorial: Loops', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = createUtils(
    environment,
    assert,
  );

  assertLogs(
    'for(i, 1, 10, writeln(i))',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
  );
  assertLogs(
    'list(5, 123, 20) foreach(i, v, writeln(i, ": ", v))',
    '0: 5',
    '1: 123',
    '2: 20',
  );
  assertLogs('list("abc", "def", "ghi") foreach(println)', 'abc', 'def', 'ghi');
});

describe('Tutorial: Dictionaries', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = createUtils(
    environment,
    assert,
  );

  withEnv(() => {
    assertReturn(
      `
      dict := Map clone;
      dict atPut("hello", "a greeting");
      dict atPut("goodbye", "a parting");
      dict hasKey("hello")`,
      true,
    );
    assertReturn('dict hasValue("a greeting")', true);
    assertReturn('dict at("hello")', 'a greeting');
    assertReturn('dict keys', ['hello', 'goodbye']);
    assertLogs(
      'dict foreach(k, v, (k..": "..v) println)',
      'hello: a greeting',
      'goodbye: a parting',
    );
  });
});

describe('Tutorial: Strings', async (assert) => {
  const { withEnv, assertReturn } = createUtils(environment, assert);

  withEnv(() => {
    assertReturn('a := "foo"', 'foo');
    assertReturn('b := "bar"', 'bar');
    assertReturn('c := a..b', 'foobar');
    assertReturn('c at(0)', 102);
    assertReturn('c at(0) asCharacter', 'f');
  });

  withEnv(() => {
    assertReturn('s := "this is a test"', 'this is a test');
    assertReturn('words := s split(" ", "\t"); words', [
      'this',
      'is',
      'a',
      'test',
    ]);
    assertReturn('words join(" ")', 'this is a test');
    assertReturn('s find("is")', 2);
    assertReturn('s find("test")', 10);
    assertReturn('s slice(10)', 'test');
    assertReturn('s slice(2, 10)', 'is is a ');
  });
});

describe('Tutorial: Objects', async (assert) => {
  const { withEnv, assertReturn } = createUtils(environment, assert);

  withEnv(() => {
    assertReturn('Contact := Object clone', {});
    assertReturn('Contact type', 'Contact');
    assertReturn('Contact proto type', 'Object');
    assertReturn('Contact name ::= nil', null);
    assertReturn('Contact address ::= nil', null);
    assertReturn('Contact city ::= nil', null);
    assertReturn(
      'holmes := Contact clone setName("Holmes") setAddress("221B Baker St") setCity("London")',
      {
        name: 'Holmes',
        address: '221B Baker St',
        city: 'London',
      },
    );
    assertReturn('holmes slotNames', ['name', 'address', 'city']);
    assertReturn(
      `Contact fullAddress := method(list(name, address, city) join("\n"));
      holmes fullAddress`,
      'Holmes\n221B Baker St\nLondon',
    );
    assertReturn(
      'holmes getSlot("fullAddress") asString',
      String.raw`method(list(name, address, city) join("\n"))`,
    );
  });

  withEnv(() => {
    assertReturn(
      `
    Contact := Object clone do(
      name ::= nil;
      address ::= nil;
      city ::= nil;
      fullAddress := method(list(name, address, city) join("\n"));
    ); Contact slotNames`,
      [
        'name',
        'setName',
        'address',
        'setAddress',
        'city',
        'setCity',
        'fullAddress',
      ],
    );

    assertReturn(
      `
    BusinessContact := Contact clone do(
      companyName ::= "";
      fullAddress := method(
        list(companyName, "Care of: " .. name, address, city) join("\n")
      )
    );

    steve := BusinessContact clone do(
      setName("Steve");
      setCompanyName("Apple Inc.");
      setAddress("1 Infinite Loop");
      setCity("Cupertino");
    );

    steve fullAddress`,
      'Apple Inc.\nCare of: Steve\n1 Infinite Loop\nCupertino',
    );
  });
});

// describe('Tutorial: ', async (assert) => {
//   const { withEnv, assertReturn, assertLogs } = createUtils(environment, assert);

//   assertReturn('', );
// });
