const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

dotenv.config();

// Middleware
app.use(
	cors({
		origin: ["http://localhost:5173"], // client side link
		credentials: true, // allow cookies
	}),
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
	console.log("inside the logger middleware");
	next();
};

const verifyToken = (req, res, next) => {
	const token = req?.cookies?.token;
	console.log("cookie in the middleware", token);
	if (!token) {
		return res.status(401).send({ message: "Unauthorized Access" });
	}
	// verify token
	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(401).send({ message: "Unauthorized Access" });
		}

		req.decoded = decoded;
		next();
	});
};

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

		// JWT Related API
		app.post("/jwt", async (req, res) => {
			const userData = req.body;

			// generate token
			const token = jwt.sign(userData, process.env.JWT_SECRET, {
				expiresIn: "1d",
			});

			// set token in the cookies
			res.cookie("token", token, {
				httpOnly: true,
				secure: false,
			});

			res.send({ success: true });
		});

		// Get all jobs
		app.get("/jobs", async (req, res) => {
			const email = req.query.email;
			let query = {};
			if (email) {
				query.hr_email = email;
			}

			const cursor = jobsCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// could be done but should not be done
		// app.get("/jobsByEmailAddress", async (req, res) => {
		// 	const email = req.query.email;
		// 	const query = { hr_email: email };
		// 	const cursor = jobsCollection.find(query);
		// 	const result = await cursor.toArray();
		// 	res.send(result);
		// });

		app.get("/jobs/applications", async (req, res) => {
			const email = req.query.email;
			const query = { hr_email: email };
			const jobs = await jobsCollection.find(query).toArray();

			// should use aggregate to have optimum data fetching
			for (const job of jobs) {
				const applicationQuery = { jobId: job._id.toString() };
				const application_count = await applicationsCollection.countDocuments(applicationQuery);
				job.application_count = application_count;
			}
			res.send(jobs);
		});

		// Get a single job by ID
		app.get("/jobs/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await jobsCollection.findOne(query);
			res.send(result);
		});

		app.post("/jobs", async (req, res) => {
			const newJob = req.body;
			console.log(newJob);
			const result = await jobsCollection.insertOne(newJob);
			res.send(result);
		});

		// Application related API
		// Get all applications
		// app.get("/applications", async (req, res) => {
		// 	const cursor = applicationsCollection.find();
		// 	const result = await cursor.toArray();
		// 	res.send(result);
		// });

		app.get("/applications/job/:job_id", async (req, res) => {
			const job_id = req.params.job_id;
			const query = { jobId: job_id };
			const result = await applicationsCollection.find(query).toArray();
			res.send(result);
		});

		// Get applications by email
		app.get("/applications", logger, verifyToken, async (req, res) => {
			const email = req.query.email;
			// console.log("inside applications api", req.cookies);
			if (email !== req.decoded.email) {
				return res.status(403).send({ message: "Forbidden Access!" });
			}
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

		app.patch("/applications/:id", async (req, res) => {
			const id = req.params.id;
			const filter = { _id: new ObjectId(id) };
			const updatedDoc = {
				$set: {
					status: req.body.status,
				},
			};
			const result = await applicationsCollection.updateOne(filter, updatedDoc);
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
