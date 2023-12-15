const http = require("http");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const name = process.env.MONGO_DB_NAME;
const collection = process.env.MONGO_COLLECTION;
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${username}:${password}@cluster0.momtem6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});
client.connect();
const databaseAndCollection = {
    db: name,
    collection: collection,
};

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static('public'));
process.stdin.setEncoding("utf8");

const host = process.argv[2];
app.listen(host);
console.log(`Web server started and running at http://localhost:${host}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let dataInput = process.stdin.read();
    if (dataInput !== null) {
        let command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        } else {
            console.log(`Invalid command: ${command}`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});

app.get("/", (request, response) => {
    response.render("home");
});

app.get("/findMovie", (request, response) => {
    response.render("findMovie");
});

app.post("/review", (request, response) => {
    let variables = {
        movieName: request.body.results,

    }
    
    response.render("review", variables);
   
});

app.get("/findReview", (request, response) => {
    response.render("findReview");
});

app.get("/rating", (request, response) => {
    response.render("rating");
});

app.get("/remove", (request, response) => {
    response.render("remove");
});

app.post("/processReview", async (request, response) => {
    let variables = {
        reviewer: request.body.reviewer ?? "NONE",
        movie: request.body.movie ?? "NONE",
        rating: request.body.rating ?? "NONE",
        review: request.body.review ?? "NONE",
    };
    try {
        await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .insertOne(variables);
    } catch (e) {
        console.error(e);
    }
    response.render("reviewPost", variables);
});

app.post("/findReview", async (request, response) => {
    let movie = request.body.movie;
    let result;
    try {
        let filter = { movie: movie };
        const cursor = client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
        result = await cursor.toArray();
    } catch (e) {
        console.error(e);
    }
    const reviews = result
        .map(
            (applicant) =>
                `<hr><strong>Reviewer: </strong>${applicant.reviewer}<br>
    <strong>Movie: </strong>${applicant.movie}<br>
    <strong>Rating: </strong><i data-star=${applicant.rating}></i><br>
    <strong>Review: </strong><br>${applicant.review}<br>`
        )
        .join("");
    let variables = { reviews: reviews };
    response.render("reviewsPost", variables);
});

app.post("/processRating", async (request, response) => {
    let rating = request.body.rating;
    let result;
    try {
        let filter = { rating: { $gte: rating } };
        const cursor = client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .find(filter);
        result = await cursor.toArray();
    } catch (e) {
        console.error(e);
    }
    const tableRows = result
        .map(
            (applicant) =>
                `<tr><td>${applicant.reviewer}</td><td><i data-star=${applicant.rating}></i></td><td>${applicant.movie}</td></tr>`
        )
        .join("");
    let variables = { tableRows: tableRows };
    response.render("ratingPost", variables);
});

app.post("/processRemove", async (request, response) => {
    let result;
    try {
        result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
    }
    catch (e) {
        console.error(e);
    }
    let numOfApplications = result.deletedCount;
    response.render("removePost", {numOfApplications: numOfApplications});
});
