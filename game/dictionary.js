const fs = require("fs");

const listViWord = new Set(
  fs
    .readFileSync("Viet74K.txt", "utf8")
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
);

const viDictionary = Array.from(listViWord).filter(
  (phrase) => phrase.split(" ").length === 2
);

module.exports = {
    viDictionary
};