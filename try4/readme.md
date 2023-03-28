# Try 4

A mini-try to explore how to compile the code. Here are a bunch of
examples in Io "compiled" to JavaScript.

```js
/**
Account := Object clone do(
  balance := 0.0
  deposit := method(v,  balance = balance + v)
  show := method(write("Account balance: $", balance, "\n"))
)

"Inital: " print
Account show

"Depositing $10\n" print
Account deposit(10.0)

"Final: " print
Account show
 */
this.Account = this.Receiver.clone().do(function () {
  this.balance = 0;
  this.deposit = function (v) {
    return (this.balance = this.balance + v);
  };
  this.show = function () {
    return this.write('Account balance: $', this.balance, '\n');
  };
});

this.str('Initial: ').print();
this.Account.show();

this.str('Depositing $10\n').print();
this.Account.deposit(10.0);

this.str('Final: ').print();
this.Account.show();
```

```js
/**
ack := method(m, n,
  if (m < 1, return n + 1)
  if (n < 1, return ack(m - 1, 1))
  return ack(m - 1, ack(m, n - 1))
)

ack(3, 4) print
"\n" print
*/
this.ack = function (m, n) {
  if (m < 1) {
    return n + 1;
  }
  if (n < 1) {
    return this.ack(m - 1, 1);
  }
  return this.ack(m - 1, this.ack(m, n - 1));
};

this.print(this.ack(3, 4));
```

```js
/**
bottle := method(i,
	if(i==0, return "no more bottles of beer")
	if(i==1, return "1 bottle of beer")
	return i asString .. " bottles of beer"
)

for(i, 99, 1, -1,
	write(bottle(i), " on the wall, ", bottle(i), ",\n")
	write("take one down, pass it around,\n")
	write(bottle(i - 1), " on the wall.\n\n")
)
*/
this.bottle = function (i) {
  if (i === 0) {
    return 'no more bottles of beer';
  }
  if (i === 1) {
    return '1 bottle of beer';
  }
  return i + ' bottles of beer';
};

for (let i = 99; i >= 1; i += -1) {
  this.write(this.bottle(i) + ' on the wall, ' + this.bottle(i) + ',\n');
  this.write('take one down, pass it around,\n');
  this.write(this.bottle(i - 1) + ' on the wall.\n\n');
}
```
