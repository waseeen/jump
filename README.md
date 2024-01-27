# Tages test case

Sorting a 1TB file with strings, using less than 500MB RAM

## Installation

1. Clone repo
2. Edit settings.filename to match it with your target file

## Usage

```bash
node .
```

## Benchmark

Restricting memory to 500MB max with

```bash
node --max-old-space-size=500
```

232MB file (5MB splits) was sorted in 01h01m59s

232MB file (80MB splits) was sorted in 00h26m49s

3.48GB file (80MB splits) was sorted in 12h02m47s
