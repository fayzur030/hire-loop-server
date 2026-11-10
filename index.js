import express from 'express'
import 'dotenv/config'
const app = express()
import { MongoClient, ObjectId } from 'mongodb'
import cors from 'cors'
const port = 5000

//todo: middleware
app.use(express.json())
app.use(cors())

const client = new MongoClient(process.env.MONGO_CLIENT_URI)
export async function connectToMongoDB() {
  try {
    await client.connect()
    console.log('You successfully connected to MongoDB!')
    return client
  } catch (err) {
    console.dir(err)
  }
}

const mongoClient = await connectToMongoDB()
const db = mongoClient.db('hire-loop')
const usersCollection = db.collection('user')
const jobs = db.collection('jobs')
const applications = db.collection('applications')

// todo: Jobs related api

// add job

app.post('/add-job', async (req, res) => {
  try {
    const addJob = req.body
    const result = await jobs.insertOne(addJob)
    res.status(200).send({
      success: true,
      message: 'Add job successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: 'Failed to add new job',
      error: error.message,
    })
  }
})

// get all job

app.get('/jobs', async (req, res) => {
  try {
    const query = {}

    if (req.query) {
      //todo: search jobType
      if (req.query.jobType) {
        query.jobType = {
          $regex: `^${req.query.jobType.trim()}$`,
          $options: 'i',
        }
      }
      // isRemote
      if (req.query.isRemote !== undefined) {
        query.isRemote = req.query.isRemote === 'true'
      }
      if (req.query.category) {
        query.category = {
          $regex: `^${req.query.category.trim()}$`,
          $options: 'i',
        }
      }

      // Search title, description and location
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { location: { $regex: req.query.search, $options: 'i' } },
          { responsibilities: { $regex: req.query.search, $options: 'i' } },
          { requirements: { $regex: req.query.search, $options: 'i' } },
        ]
      }
    }
    const result = await jobs.find(query).toArray()
    res.status(200).send({
      statusbar: 'success',
      message: 'Jobs fetched successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: 'Failed to fetch jobs',
      error: error.message,
      success: false,
    })
  }
})

//delete single job

app.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await jobs.deleteOne({ _id: new ObjectId(id) })
    res.status(200).send({
      success: true,
      message: 'Delete job successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: 'Failed to delete job',
      error: error.message,
    })
  }
})

//update job

app.patch('/update-jobs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updatedJob = req.body
    const result = await jobs.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedJob }
    )
    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'Job not found',
      })
    }
    res.send({
      success: true,
      message: 'Job updated successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: 'Failed to update job',
    })
  }
})

//todo: get single job for details

app.get('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await jobs.findOne({
      _id: new ObjectId(id),
    })

    if (!result) {
      return res.status(404).send({
        success: false,
        message: 'Job not found',
      })
    }

    res.status(200).send({
      success: true,
      message: 'Job fetched successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error fetching job:', error)

    res.status(500).send({
      success: false,
      message: 'Internal server error',
    })
  }
})

//todo: job application related api
app.post('/apply-job', async (req, res) => {
  try {
    const application = { ...req.body, appliedAt: new Date() }
    const result = await applications.insertOne(application)
    res.status(200).send({
      success: true,
      message: 'Job application submitted successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error submitting job application:', error)
    res.status(500).send({
      success: false,
      message: 'Failed to submit job application',
      error: error.message,
    })
  }
})

//todo: find all users
app.get('/users', async (req, res) => {
  try {
    const result = await usersCollection.find().toArray()
    res.status(200).send({
      statusbar: 'success',
      message: 'User fetched successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      message: 'Failed to fetch users',
      error: error.message,
      success: false,
    })
  }
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`HireLoop app listening on port ${port}`)
})
