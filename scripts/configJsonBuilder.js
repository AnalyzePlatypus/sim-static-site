const fs = require('fs');
const path =  require("path");
const Papa = require('papaparse');

// Helpers

// Read JSON files:

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);
const resolveFilePath = filepath => path.resolve(process.cwd(), filepath)

function readAndParseCSVFile(path) {
  return Papa.parse(fs.readFileSync(path).toString(), {
    header: true,
  });
}


const readJSONFile = pipe(
  resolveFilePath,
  fs.readFileSync,
  buffer => buffer.toString(),
  JSON.parse
)

const NEWLINE_DELIMITER = "\n";
const COLUMN_DELIMITER = "\t";

function tsvToJson(tsv) {
  const rows = tsv.split(NEWLINE_DELIMITER);
  const keys = rows[0].split(COLUMN_DELIMITER);
  const itemRows = rows.slice(1);
  return itemRows.map(tsvStringToJson(keys));
}

const tsvStringToJson = keys => tsvString => {
  return Object.fromEntries(tsvString.split(COLUMN_DELIMITER).map((item, i) => [keys[i], item]));
}


const CONFIG_PATH = "./config/config.json";
const SCHEDULE_FILE_DIRECTORY = "./config/schedules"
const OUTPUT_FILE_PATH = "./config/config.built.json";


console.log(`\nSIM Static Site config file builder`);

console.log(`🌀 Reading config file... (${CONFIG_PATH})`);
const config = readJSONFile(CONFIG_PATH);

console.log(`ℹ️ Found ${config.channels.length} channels. Reading schedule files...`);

config.channels = config.channels.map(channel => {
  const scheduleFileName = channel.sessionScheduleFile;
  // const fileText = fs.readFileSync(SCHEDULE_FILE_DIRECTORY + "/" + scheduleFileName).toString();
  const sessions = readAndParseCSVFile(path.join(SCHEDULE_FILE_DIRECTORY,scheduleFileName)).data;
  sessions.forEach(session => {
    console.log(session.startTimestamp);
    if(session.startTimestamp.length !== 20) throw `BUG: Generated invalid timestamp ${session.startTimestamp}`
  })
  return {
    ...channel,
    sessionScheduleFile: undefined, // Wipe the schedule file path from generated JSON
    sessions
  }
})

console.log(`🌀 Writing built config file (${OUTPUT_FILE_PATH})`);
fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(config));

console.log(`✅ Built config file successfully`);