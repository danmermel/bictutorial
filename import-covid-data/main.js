const { request, connect } = require("undici")
const { MongoClient } = require("mongodb")
const fs = require ("fs")

const noop = (value) => value
const connections = require("./output.json")
//reads the terraform.tfvars file and extracts variables from it... this creates an admin_password variable to be used in the main function
eval(fs.readFileSync("../terraform/terraform.tfvars").toString())



async function getDataAsJson() {
    // publicly available through https://covid19.who.int/data
    const response = await request("https://covid19.who.int/WHO-COVID-19-global-data.csv")
    const csvData = await response.body.text()

    // parse CSV and make sure numbers are returned as numbers and not strings			
    const keys = [
        { name: "dateReported", parser: noop },
        { name: "countryCode", parser: noop },
        { name: "country", parser: noop },
        { name: "WHORegion", parser: noop },
        { name: "newCases", parser: Number },
        { name: "cumulativeCases", parser: Number },
        { name: "newDeaths", parser: Number },
        { name: "cumulativeDeaths", parser: Number },
    ]

    const array = [];
    for (line of csvData.split("\n").filter(e => e.trim()).splice(1)) {
        const object = {};
        const values = line.split(",")

        for (let i = 0; i < keys.length; i++) {
            if (values[i] !== undefined) {

                object[keys[i].name] = keys[i].parser(values[i].trim());

            }
        }
        array.push(object);
    }
    return array;

}



async function main() {

    const collection_name="daily_covid_global_data"
    const uri = `${connections.analytics.value[0].composed[0]}&ssl=true&tlsInsecure=true`.replace('$PASSWORD', admin_password)
    //console.log(uri)
    
    const docs = await getDataAsJson();

    const client = new MongoClient(uri);
    
    console.log("connecting to MongoDB...")
    client.connect();

    // select DB
    const database = client.db("WHO");
    const collection = database.collection(collection_name)

    const collections = (await database.listCollections().toArray()).map(e => e.name) 
    //console.log(collections)
    if (collections.indexOf(collection_name) !== -1 ){
        console.log("Collection exists.. dropping")
        //collection exists... drop it
        await collection.drop()
    } 

    console.log("inserting data...")
    
    // insert data
    await collection.insertMany(docs)

    client.close()
    const bi_host = connections.bi_connector.value[0].hosts[0].hostname
    const bi_port = connections.bi_connector.value[0].hosts[0].port
    console.log("Data is in MongoDB! Now use this connection string with Tableau in the next step: " )
    console.log("Hostname: ", bi_host)
    console.log("Port: ", bi_port)

}

main();