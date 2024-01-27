#!/bin/bash
x=1
while [ $x -lt 28000000 ]
do
echo "$x" >> example_raw
x=$(( $x + 1 ))
done
shuf example_raw > example
unlink example_raw