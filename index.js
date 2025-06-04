const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@devcluster.s7bmtla.mongodb.net/?retryWrites=true&w=majority&appName=DevCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();

		const careerCodeDB = client.db("careerCode");
		const jobsCollection = careerCodeDB.collection("jobs");
		const applicationsCollection = careerCodeDB.collection("applications");

		// Get all jobs
		app.get("/jobs", async (req, res) => {
			const cursor = jobsCollection.find();
			const result = await cursor.toArray();
			res.send(result);
		});

		// Get a single job by ID
		app.get("/jobs/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await jobsCollection.findOne(query);
			res.send(result);
		});

		// Application related API
		// Get all applications
		// app.get("/applications", async (req, res) => {
		// 	const cursor = applicationsCollection.find();
		// 	const result = await cursor.toArray();
		// 	res.send(result);
		// });

		// Get applications by email
		app.get("/applications", async (req, res) => {
			const email = req.query.email;
			const query = {
				applicant: email,
			};
			const result = await applicationsCollection.find(query).toArray();

			// bad way to aggregate data
			for (const application of result) {
				const jobId = application.jobId;
				const jobQuery = { _id: new ObjectId(jobId) };
				const job = await jobsCollection.findOne(jobQuery);
				application.company = job.company;
				application.title = job.title;
				application.company_logo = job.company_logo;
			}

			res.send(result);
		});

		// Apply for a job
		app.post("/applications", async (req, res) => {
			const application = req.body;
			console.log(application);
			const result = await applicationsCollection.insertOne(application);
			res.send(result);
		});

		// Delete an application
		app.delete("/applications/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await applicationsCollection.deleteOne(query);
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log("Pinged your deployment. You successfully connected to MongoDB!");
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("Career Code Server is Running!");
});

app.listen(port, () => {
	console.log(`Career Code Server is running on port ${port}`);
});
