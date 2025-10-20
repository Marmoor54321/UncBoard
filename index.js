import fs from "node:fs/promises";
import { buffer } from "node:stream/consumers";

const pkg = await fs.readFile("package.json")
.then((buffer) => buffer.toString())
.then((str)=>JSON.parse(str));

console.log(pkg);
