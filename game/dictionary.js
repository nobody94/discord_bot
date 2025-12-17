const fs = require("fs");
const path = require('path');

const pathViToFile = path.join(__dirname, '..', 'Viet74K', 'note.txt');
const pathEnToFile = path.join(__dirname, '..', 'en-dictionary', 'config.json');

const listViWord = new Set(
  fs
    .readFileSync(pathViToFile, "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const rawData =fs.readFileSync(pathEnToFile, "utf8");
const jsonArray = JSON.parse(rawData);  
const sourceArray = Array.isArray(jsonArray) ? jsonArray : Object.keys(jsonArray);
const enDictionary = new Set(sourceArray
            .map((w) => w.trim().toLowerCase())
            .filter(Boolean(w) && !w.includes('-')));

const viDictionary = Array.from(listViWord).filter(
  (phrase) => phrase.split(" ").length === 2
);

module.exports = {
    viDictionary,
    enDictionary
};