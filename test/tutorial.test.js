import { describe, envTestUtils } from './runner/index.mjs';

import { createEnvironment } from '../index.mjs';

describe('Tutorial: Comments', async (assert) => {
  const { assertCode } = envTestUtils(createEnvironment, assert);

  assertCode(
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

  assertReturn('1+1', 2);
  assertReturn('1+1 == 2', true);
  assertReturn('2 sqrt', 1.4142135623730951);
});

describe('Tutorial: Variables', async (assert) => {
  const { assertReturn, withEnv } = envTestUtils(createEnvironment, assert);

  withEnv(() => {
    assertReturn('a := 1', 1);
    assertReturn('a', 1);
    assertReturn('b := 2 * 3', 6);
    assertReturn('a + b', 7);
  });
});

describe('Tutorial: Conditions', async (assert) => {
  const { withEnv, assertLogs } = envTestUtils(createEnvironment, assert);

  withEnv(() => {
    assertLogs(
      `a := 2;
      (a == 1) ifTrue("a is one" println) ifFalse("a is not one" println)`,
      'a is not one\n',
    );
    assertLogs(
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

  withEnv(() => {
    assertReturn('d := List clone append(30, 10, 5, 20)', [30, 10, 5, 20]);
    assertReturn('d size', 4);
    // assertLogs('d print', 'list(30, 10, 5, 20)');
    assertLogs('d print', '30,10,5,20');
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
  const { assertLogs } = envTestUtils(createEnvironment, assert);

  assertLogs(
    'for(i, 1, 10, writeln(i))',
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
  );
  assertLogs(
    'list(5, 123, 20) foreach(i, v, writeln(i, ": ", v))',
    '0: 5\n',
    '1: 123\n',
    '2: 20\n',
  );
  assertLogs(
    'list("abc", "def", "ghi") foreach(println)',
    'abc\n',
    'def\n',
    'ghi\n',
  );
});

describe('Tutorial: Dictionaries', async (assert) => {
  const { withEnv, assertReturn, assertLogs } = envTestUtils(
    createEnvironment,
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
      'hello: a greeting\n',
      'goodbye: a parting\n',
    );
  });
});

describe('Tutorial: Strings', async (assert) => {
  const { withEnv, assertReturn } = envTestUtils(createEnvironment, assert);

  withEnv(() => {
    assertReturn('a := "foo"', 'foo');
    assertReturn('b := "bar"', 'bar');
    assertReturn('c := a..b', 'foobar');
    assertReturn('c at(0)', 102);
    assertReturn('c at(0) asCharacter', 'f');
  });

  withEnv(() => {
    assertReturn('s := "this is a test"', 'this is a test');
    assertReturn(String.raw`words := s split(" ", "\t"); words`, [
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
  const { withEnv, assertReturn } = envTestUtils(createEnvironment, assert);

  withEnv(() => {
    assertReturn('Contact := Receiver clone', {});
    assertReturn('Contact type', 'Contact');
    assertReturn('Contact proto type', 'Receiver');
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
      String.raw`
      Contact fullAddress := method(list(name, address, city) join("\n"));
      holmes fullAddress
      `,
      'Holmes\n221B Baker St\nLondon',
    );
    assertReturn(
      'holmes getSlot("fullAddress") toString',
      String.raw`method(list(name, address, city) join("\n"))`,
    );
  });

  withEnv(() => {
    assertReturn(
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

    assertReturn(
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

  withEnv(() => {
    assertError(
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

    assertLogs(
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

//   assertReturn('', );
// });
