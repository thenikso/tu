#!/usr/bin/env tu
words := "video killed the radio star" split
writeln("original: ", words join(" "))
words = words sortBy(block(a, b, a < b))
writeln("sortBy:   ", words join(" "))
