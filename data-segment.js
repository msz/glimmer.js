
const nextFreeHandle = 12


const moduleTable = [];


const heapTable = JSON.parse("[0,7,0,0,7,7,0,0,14,42,0,0]");


const pool = JSON.parse("{\"strings\":[\"div\",\"Hello\",\"From B: \"],\"arrays\":[[]],\"tables\":[],\"handles\":[0],\"serializables\":[],\"floats\":[],\"negatives\":[]}");

const specifierMap = JSON.parse("{\"template:/my-app/components/A\":0,\"template:/my-app/components/B\":8}");
const symbolTables = JSON.parse("{}");
export default { moduleTable, heapTable, pool, specifierMap, symbolTables, nextFreeHandle };