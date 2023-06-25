#!/bin/sh
wget -O /tmp/flatc.zip "https://github.com/google/flatbuffers/releases/latest/download/Linux.flatc.binary.clang++-12.zip"
unzip /tmp/flatc.zip -d /usr/local/bin
