#!/usr/bin/env tu

exampleBreak := method(
	b := Sequence clone
	for(i, 0, 10, if(i == 5, break); b appendSeq(i toString))
	b
)

exampleContinue := method(
	b := Sequence clone
	for(i, 0, 10, if(i == 5, continue); b appendSeq(i toString))
	b
)

exampleReturn := method(
	b := Sequence clone
	for(i, 0, 10, if(i == 5, return b); b appendSeq(i toString))
	b
)

writeln("break:    ",
	if (exampleBreak == "01234", "OK", "FAILED")
)

writeln("continue: ",
	if (exampleContinue == "01234678910", "OK", "FAILED")
)

writeln("return:   ",
	if (exampleReturn == "01234", "OK", "FAILED")
)

