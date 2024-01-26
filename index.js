import fs, { readdirSync } from "fs";
import path from "path";
import readline from "readline";

let fileCounter = 0;
let chunkCounter = 0;

const settings = {
  dir: "temp",
  filename: "ex", //input file for sorting
  outfile: "sorted",
  outdir: "out",
  maxFileMb: 80, //max splitted file size, if --max-old-space-size=500, keep it less than 80 to avoid heap out of memory
  maxFilesInDir: 500, //not more than 1000, otherwise readdirSync will not be avaliable to get them
};

//paste here your sorting algorithm/compareFunction
function compare(a, b) {
  if (+a - +b > 0) return 1;
  return -1;
}

async function splitFile(path) {
  const rl = readline.createInterface({
    input: fs.createReadStream(path),
  });
  for await (const line of rl) {
    fs.appendFileSync(
      `${settings.dir}/chunk${chunkCounter}/${fileCounter}`,
      line + "\n",
      (err) => {
        console.log(err);
      }
    );
    if (
      fs.statSync(`${settings.dir}/chunk${chunkCounter}/${fileCounter}`).size >
      settings.maxFileMb * 1024 * 1024
    ) {
      fileCounter++;
      if (fileCounter % settings.maxFilesInDir == 0) {
        chunkCounter++;
        if (!fs.existsSync(`${settings.dir}/chunk${chunkCounter}`)) {
          fs.mkdirSync(`${settings.dir}/chunk${chunkCounter}`);
        }
      }
    }
  }
  rl.close();
}

const updatePaths = (dir) => {
  const paths = [];
  readdirSync(dir).forEach((d) => {
    readdirSync(`${dir}/${d}`).forEach((file) => {
      paths.push(`${dir}/${d}/${file}`);
    });
  });
  return paths.sort((a, b) => {
    if (a.length != b.length) return a.length - b.length;
    return +a.charAt(a.length - 1) - +b.charAt(b.length - 1);
  });
};

async function externalMerge(file1, file2, outfile) {
  outfile += `${Date.now()}`;
  if (!fs.existsSync(file1)) {
    fs.writeFileSync(file1, "");
  }
  if (!fs.existsSync(file2)) {
    fs.writeFileSync(file2, "");
  }
  const readMain = readline.createInterface({
    input: fs.createReadStream(file1),
  });

  const readTemp = readline.createInterface({
    input: fs.createReadStream(file2),
  });
  const iterMain = readMain[Symbol.asyncIterator]();
  const iterTemp = readTemp[Symbol.asyncIterator]();
  var aw1 = await iterMain.next();
  var aw2 = await iterTemp.next();
  while (!aw1.done && !aw2.done) {
    if (compare(aw1.value, aw2.value) > 0) {
      fs.appendFileSync(outfile, aw2.value + "\n");
      aw2 = await iterTemp.next();
      continue;
    }

    fs.appendFileSync(outfile, aw1.value + "\n");
    aw1 = await iterMain.next();
  }
  if (!aw1.done) {
    while (!aw1.done) {
      fs.appendFileSync(outfile, aw1.value + "\n");

      aw1 = await iterMain.next();
    }
  }

  if (!aw2.done) {
    while (!aw2.done) {
      fs.appendFileSync(outfile, aw2.value + "\n");

      aw2 = await iterTemp.next();
    }
  }
}

function sortFile(filePath) {
  const data = fs.readFileSync(filePath, { encoding: "utf8" });

  const lines = data
    .trim()
    .split("\n")
    .sort((a, b) => compare(a, b));
  fs.writeFileSync(filePath, lines.join("\n"));
}

const start = new Date();
console.log("Started at ");
console.log(start);

if (!fs.existsSync(settings.dir)) {
  fs.mkdirSync(settings.dir);
}
if (!fs.existsSync(settings.outdir)) {
  fs.mkdirSync(settings.outdir);
}
if (!fs.existsSync(`${settings.dir}/chunk${chunkCounter}`)) {
  fs.mkdirSync(`${settings.dir}/chunk${chunkCounter}`);
}

await splitFile(settings.filename);

var paths = updatePaths(settings.dir);
paths.forEach((p) => sortFile(p));

while (paths.length > 1) {
  await externalMerge(paths[0], paths[1], `${path.parse(paths[1]).dir}/`);
  fs.unlinkSync(paths[0]);
  fs.unlinkSync(paths[1]);
  paths = updatePaths(settings.dir);
}

fs.renameSync(paths[0], `${settings.outdir}/${settings.outfile}`);
fs.rmSync(settings.dir, { recursive: true, force: true });

console.log(`${settings.filename} was successfuly sorted!`);

const end = new Date();
console.log("Finished at");
console.log(end);

console.log("Total elapsed time:");
console.log(end - start);
