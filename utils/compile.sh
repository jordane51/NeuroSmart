#!/bin/sh
PREFIX="../src/js/"
TEST=$(find $PREFIX -name '*.js')
java -jar compiler.jar $TEST --js_output_file ../build/neurosmart.js
