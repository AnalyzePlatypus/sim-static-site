const Papa = require('papaparse');
const fs = require('fs');
const path =  require("path");

/*
Channel A
UTC ,Speaker,Speaker's Home Time,Topic,ASL Interpreters,Zoom,Speaker's Email,Sobriety,Time Zone,Flex,UTC-6,Speaker's Phone,Moderator,Moderator 2,Back-Up Speaker,Back-Up Speaker's Phone Number,ASL Interptreters

Channel B
UTC ,ASL Interpreters,Speaker/Coordinator,Topic,Speaker 2,Speaker 3,Speaker 4,Speaker 5,Speaker's Home Time,Interviewer/Moderator,Email,ASL Interpreters,Host,Email,Co-host,Speaker 1 Email Address ,Speaker 1 Phone #,Speaker 2 Email Address ,Speaker 2 Phone #,Speaker 3 Email Address,Speaker 3 Phone #,Speaker 4 Email Address,Speaker 4 Phone #,Speaker 5 Email Address 

Channel C
UTC,Language,Contact Person,Contact Details,Groups' Home Time,Groups' City,Phone Numbers,,,,,,

Required output:
startTimestamp	title	speaker	sessionType	language	notes

*/



// Helpers

// Read JSON files:

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x);
const resolveFilePath = filepath => path.resolve(process.cwd(), filepath)


function readAndParseCSVFile(path) {
  return Papa.parse(fs.readFileSync(path).toString(), {
    header: true,
    dynamicTyping: true
  });
}

function writeCSVFile(json, outputFileName) {
  const tsvString = Papa.unparse(json);
  const outputFilePath = path.join(EXPORT_DIR, outputFileName)
  fs.writeFileSync(outputFilePath, tsvString);
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

const readJSONFile = pipe(
  resolveFilePath,
  fs.readFileSync,
  buffer => buffer.toString(),
  JSON.parse
)


const CONF_DAY_1 = "2021-11-18";
const CONF_DAY_2 = "2021-11-19";

const TIMESTAMP_REQUIRED_CHAR_COUNT = 20;

function utcTimeToUTCTimestamp(time) {
  if(!time || !time.includes(":")) throw new TypeError(`Invalid time. Does not contain required ':' character (Got: ${time})`);
  const hour = parseInt(time.split(":")[0]);
  const isConfDay1 = hour > 12;
  const dateFragment = isConfDay1 ? CONF_DAY_1 : CONF_DAY_2;
  const requiresPadding = time.split(":")[0].length == 1;
  const result = `${dateFragment}T${requiresPadding ? '0': ''}${time}:00Z`;

  const ONE_HOUR_IN_MS = 60 * 60 * 1000;
  new Date(new Date(result).getTime() + ONE_HOUR_IN_MS).toISOString()
  if(result.length !== 20) throw `BUG: Generated invalid timestamp ${result}`
  return result;
}

const mappings = [
  {
    title: "Channel A",
    sourceFilePath: "./data/SIM 2021 Speakers Master Doc.xlsx - Channel A.csv",
    outputFileName: "channelA.csv",
    transformFn(row) {
      return {
        startTimestamp: utcTimeToUTCTimestamp(row['UTC']),
        title: row['Topic'],
        speaker: row['Speaker'],
        sessionType: "Speaker",
        language: "English",
        notes: ""
      }
    }
  },
  {
    title: "Channel B",
    sourceFilePath: "./data/SIM 2021 Speakers Master Doc.xlsx - Channel B.csv",
    outputFileName: "channelB.csv",
    transformFn(row) {
      return {
        startTimestamp: utcTimeToUTCTimestamp(row['UTC ']),
        title: row['Topic'],
        speaker: row['Speaker/Coordinator'],
        sessionType: "Panel",
        language: "English",
        notes: ""
      }
    }
  },
  {
    title: "Channel C",
    sourceFilePath: "./data/SIM 2021 Speakers Master Doc.xlsx - Channel C.csv",
    outputFileName: "channelC.csv",
    transformFn(row) {
      // UTC,Language,Contact Person,Contact Details,Groups' Home Time,Groups' City,Phone Numbers,,,,,,
      return {
        startTimestamp: utcTimeToUTCTimestamp(row['UTC']),
        title: row['Language'],
        speaker: row['Contact Person'],
        sessionType: "Other",
        language: row['Language'],
        notes: ""
      }
    }
  },
  {
    title: "Channel D",
    sourceFilePath: "./data/SIM 2021 Speakers Master Doc.xlsx - Channel A.csv",
    outputFileName: "channelD.csv",
    // UTC,Language,Contact Person,Contact Details,Groups' Home Time,Groups' City,Phone Numbers,,,,,,
    transformFn(row, i, all) {
      if(i == 0 || i == 23) {
        return {
          startTimestamp: utcTimeToUTCTimestamp(row['UTC']),
          title: '(No session)',
          speaker: "",
          sessionType: "SESSION_INACTIVE",
          language: "English",
          notes: ""
        }
      }
      return {
        startTimestamp: utcTimeToUTCTimestamp(row['UTC']),
        title: 'Shares on previous Channel A session',
        speaker: "Everyone",
        sessionType: "Discussion",
        language: "English",
        notes: ""
      }
    }
  },
]

const EXPORT_DIR = "../config/schedules"

function main() {
  ensureDirExists(EXPORT_DIR);

  mappings.forEach(({title, sourceFilePath, outputFileName, transformFn}, i, all)=>{
    console.log(`🌀 [${i + 1}/${all.length}] Processing source file...`)
    const rows = readAndParseCSVFile(sourceFilePath);
    const results = rows.data.map(transformFn);
    writeCSVFile(results, outputFileName);
  })

  console.log(`✅ Done!`);
  console.log(`📝 Result files are in ${EXPORT_DIR}`);
}

main();