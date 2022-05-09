const {request} = require("undici")
const { MongoClient } = require("mongodb")

const uri = ""


// get up-to-date covid data
async function getDataAsJson(){
    const data = await request("https://covid19.who.int/WHO-COVID-19-global-data.csv")
    const csvData = await data.body.text()

    // parse CSV
    const keys = csvData.split("\n")[0].split(",")

    const array = [];
    for( line of csvData.split("\n").splice(1)){
        const object = {};
        const values = line.split(",")
        for(let i=0;i<keys.length;i++){
            if(values[i] !== undefined){
           
            object[keys[i].trim()] = values[i].trim();

            }
        }
        array.push(object);
    }
    return array;
    
}



async function main(){
    const docs = await getDataAsJson();
        
    const client = new MongoClient(uri);
    client.connect();
    const database = client.db("WHO_DATA");

   const collection = database.collection("daily_covid_global_data")

    console.log("inserting data...")

   await collection.insertMany(docs)

   client.close()
}

main();