"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "templates");
const dest = path.join(root, "lib", "templates");

if (!fs.existsSync(src)) {
  console.warn("copy-templates: carpeta templates/ no encontrada, se omite.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
