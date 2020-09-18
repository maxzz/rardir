# Overview

rardir is a small utility to pack meta data inside specified folders.

## Install

```npm -g i rardir```

or

```yarn global add rardir```

## Usage

```rardir <file(s) | folder(s)>```

## Prerequisites

[WinRar](https://www.rarlab.com/) should be installed and registered on system PATH to run rardir.
It is possible to make single executable file with npm package [pkg](https://www.npmjs.com/package/pkg).

## Handled cases

arguments | expectations
- | -
multiple files and/or folders | Move all entered items into the new tm.rar file
multple folders and no files | For each folder create s separate tm.rar files
single folder and no files | For each folder create s separate tm.rar files
sinlge foder 'tm' and no files | Zip the content of 'tm' folder to file tm.rar, move tm.rar up and remove folder 'tm'

### TODO
* add support for 7-zip
* support for remote folders (UNC path is not supported by node exec on Windows, so we cannot set working folder)
* pause mode for debugging (TBD)
