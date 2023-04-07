import { describe, envTestUtils } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Tutorial: Comments', async (assert) => {
  const { assertCode } = envTestUtils(createEnvironment, assert);

  await assertCode(
    `#!/usr/bin/env tu
    /**
     * Multi-line comment
     */
    1 + 1 // a line comment
  `,
    '1 +(1)',
  );
});

describe('Tutorial: Math', async (assert) => {
  const { assertReturn } = envTestUtils(createEnvironment, assert);

  await assertReturn('1+1', 2);
  await assertReturn('1+1 == 2', true);
  await assertReturn('2 sqrt', 1.4142135623730951);
});

describe('Tutorial: Variables', async (assert) => {
  const { assertReturn, withEnv } = envTestUtils(createEnvironment, assert);

  await withEnv(async () => {
    await assertReturn('a := 1', 1);
    await assertReturn('a', 1);
    await assertReturn('b := 2 * 3', 6);
    await assertReturn('a + b', 7);
  });
});

describe('Tutorial: Conditions', async (assert) => {
  const { withEnv, assertLogs } = envTestUtils(createEnvironment, assert);

  await withEnv(async () => {
    await assertLogs(
      `a := 2;
      (a == 1) ifTrue("a is one" println) ifFalse("a is not one" println)`,
      'a is not one\n',
    );
    await assertLogs(
      'if(a == 1, writeln("a is one"), writeln("a is not one"))',
      'a is not one\n',
    );
  });
});

describe('Tutorial: List', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = envTestUtils(
    createEnvironment,
    assert,
  );

  await withEnv(async () => {
    await assertReturn(
      'd := List clone append(30, 10, 5, 20)',
      [30, 10, 5, 20],
    );
    await assertReturn('d size', 4);
    // await assertLogs('d print', 'list(30, 10, 5, 20)');
    await assertLogs('d print', '30,10,5,20');
    await assertReturn('d := d sort', [5, 10, 20, 30]);
    await assertReturn('d first', 5);
    await assertReturn('d last', 30);
    await assertReturn('d at(2)', 20);
    await assertReturn('d remove(30)', [5, 10, 20]);
    await assertReturn('d atPut(1, 123)', [5, 123, 20]);
  });

  await assertReturn('list(30, 10, 5, 20) select(>10)', [30, 20]);
  await assertReturn('list(30, 10, 5, 20) detect(>10)', 30);
  await assertReturn('list(30, 10, 5, 20) map(*2)', [60, 20, 10, 40]);
  await assertReturn('list(30, 10, 5, 20) map(v, v*2)', [60, 20, 10, 40]);
});

describe('Tutorial: Loops', async (assert) => {
  const { assertLogs } = envTestUtils(createEnvironment, assert);

  await assertLogs('for(i, 1, 10, writeln(i))', [
    '1\n',
    '2\n',
    '3\n',
    '4\n',
    '5\n',
    '6\n',
    '7\n',
    '8\n',
    '9\n',
    '10\n',
  ]);
  await assertLogs('list(5, 123, 20) foreach(i, v, writeln(i, ": ", v))', [
    '0: 5\n',
    '1: 123\n',
    '2: 20\n',
  ]);
  await assertLogs('list("abc", "def", "ghi") foreach(println)', [
    'abc\n',
    'def\n',
    'ghi\n',
  ]);
});

describe('Tutorial: Dictionaries', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = envTestUtils(
    createEnvironment,
    assert,
  );

  await withEnv(async () => {
    await assertReturn(
      `
      dict := Map clone;
      dict atPut("hello", "a greeting");
      dict atPut("goodbye", "a parting");
      dict hasKey("hello")`,
      true,
    );
    await assertReturn('dict hasValue("a greeting")', true);
    await assertReturn('dict at("hello")', 'a greeting');
    await assertReturn('dict keys', ['hello', 'goodbye']);
    await assertLogs('dict foreach(k, v, (k..": "..v) println)', [
      'hello: a greeting\n',
      'goodbye: a parting\n',
    ]);
  });
});

describe('Tutorial: Strings', async (assert) => {
  const { withEnv, assertReturn } = envTestUtils(createEnvironment, assert);

  await withEnv(async () => {
    await assertReturn('a := "foo"', 'foo');
    await assertReturn('b := "bar"', 'bar');
    await assertReturn('c := a..b', 'foobar');
    await assertReturn('c at(0)', 102);
    await assertReturn('c at(0) asCharacter', 'f');
  });

  await withEnv(async () => {
    await assertReturn('s := "this is a test"', 'this is a test');
    await assertReturn(String.raw`words := s split(" ", "\t"); words`, [
      'this',
      'is',
      'a',
      'test',
    ]);
    await assertReturn('words join(" ")', 'this is a test');
    await assertReturn('s find("is")', 2);
    await assertReturn('s find("test")', 10);
    await assertReturn('s slice(10)', 'test');
    await assertReturn('s slice(2, 10)', 'is is a ');
  });
});

describe('Tutorial: Objects', async (assert) => {
  const { withEnv, assertReturn } = envTestUtils(createEnvironment, assert);

  await withEnv(async () => {
    await assertReturn('Contact := Receiver clone', {});
    await assertReturn('Contact type', 'Contact');
    await assertReturn('Contact proto type', 'Receiver');
    await assertReturn('Contact name ::= nil', null);
    await assertReturn('Contact address ::= nil', null);
    await assertReturn('Contact city ::= nil', null);
    await assertReturn(
      'holmes := Contact clone setName("Holmes") setAddress("221B Baker St") setCity("London")',
      {
        name: 'Holmes',
        address: '221B Baker St',
        city: 'London',
      },
    );
    await assertReturn('holmes slotNames', ['name', 'address', 'city']);
    await assertReturn(
      String.raw`
      Contact fullAddress := method(list(name, address, city) join("\n"));
      holmes fullAddress
      `,
      'Holmes\n221B Baker St\nLondon',
    );
    await assertReturn(
      'holmes getSlot("fullAddress") toString',
      String.raw`method(list(name, address, city) join("\n"))`,
    );
  });

  await withEnv(async () => {
    await assertReturn(
      String.raw`
    Contact := Receiver clone do(
      name ::= nil
      address ::= nil
      city ::= nil
      fullAddress := method(list(name, address, city) join("\n"))
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

    await assertReturn(
      String.raw`
    BusinessContact := Contact clone do(
      companyName ::= "";
      fullAddress := method(
        list(companyName, "Care of: " .. name, address, city) join("\n")
      )
    )

    steve := BusinessContact clone do(
      setName("Steve")
      setCompanyName("Apple Inc.")
      setAddress("1 Infinite Loop")
      setCity("Cupertino")
    )

    steve fullAddress`,
      'Apple Inc.\nCare of: Steve\n1 Infinite Loop\nCupertino',
    );
  });
});

describe('Tutorial: Lazy Evaluation', async (assert) => {
  const { assertError } = envTestUtils(createEnvironment, assert);

  assertError(
    `
    assert := method(
      call sender doMessage(call message argAt(0)) ifFalse(
        Exception raise("failed assertion: " .. call message toString)
      )
    )

    assert(1 == 3)`,
    'failed assertion: assert(1 ==(3))',
  );
});

describe('Tutorial: Introspection', async (assert) => {
  const { withEnv, assertError, assertLogs } = envTestUtils(
    createEnvironment,
    assert,
  );

  await withEnv(async () => {
    await assertError(
      `
      Address := Receiver clone do(
        fields ::= list("name", "street", "city", "state", "zipCode");

        init := method(
          fields foreach(key,
            if (self hasSlot(key) not,
              self newSlot(key, nil)
            )
          )
        )

        emptyFields := method(
          fields select(k, self getSlot(k) == nil)
        )

        isValid := method(errors size == 0)

        assertValid := method(
          if (emptyFields size,
            Exception raise(
              self type .. " missing: " .. emptyFields join(", ")
            )
          )
        )
      )

      anAddress := Address clone setName("Alan") setStreet("6502 Mem Ln")

      anAddress assertValid`,
      'Address missing: city, state, zipCode',
    );

    await assertLogs(
      `
      e := try(
        anAddress assertValid
      );

      e catch(Exception,
          writeln("Caught: ", e error message)
      )`,
      'Caught: Address missing: city, state, zipCode\n',
    );
  });
});

// describe('Tutorial: ', async (assert) => {
//   const { withEnv, assertReturn, assertLogs, assertError } = envTestUtils(createEnvironment, assert);

//   await assertReturn('', );
// });
