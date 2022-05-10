const { request } = require("undici")
const { MongoClient } = require("mongodb")

const noop = (value) => value


async function getDataAsJson() {
    // publicly available through https://covid19.who.int/data
    const response = await request("https://covid19.who.int/WHO-COVID-19-global-data.csv")
    const csvData = await response.body.text()

    // parse CSV			
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
    // example node main.js "member-1:30117,member-2:30117,member-3:30117" "username" "password"
    const [hosts, username, password] = [...process.argv].slice(2);

    const uri = `mongodb://${username}:${password}@${hosts}/?replicaSet=replset&ssl=true&tlsInsecure=true`


    const docs = await getDataAsJson();

    const client = new MongoClient(uri);
    
    console.log("connecting to MongoDB...")
    client.connect();

    // select DB
    const database = client.db("WHO");

    // select collection
    const collection = database.collection("daily_covid_global_data")

    console.log("inserting data...")
    
    // insert data
    await collection.insertMany(docs)

    client.close()
}

main();