const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());

//middle ware
app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' });
    }
    req.decoded = decoded;
    next();
  });
}

//------------ mongodb connection

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.brxmqep.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function connectDb() {
  try {
    client.connect();
    console.log('data base connected');
  } catch (error) {
    console.log(error, 'DATA BASE ');
  }
}

connectDb();
//-------collections
const Products = client.db('sunrise_store').collection('products');
const User = client.db('sunrise_store').collection('user');

//*----------apis

// getting Products data

app.get('/products', verifyJWT, async (req, res) => {
  try {
    const query = {};
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      const products = await Products.find(query).limit(limit).toArray(); //getting limited products
      res.send({
        status: true,
        data: products,
        message: '',
      });
    } else if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase(); //getting search result
      const products = await Products.find(query).toArray();
      const searchedData = products.filter((item) =>
        item?.Product_name.toLowerCase().includes(searchTerm)
      );

      res.send({
        status: true,
        data: searchedData,
        message: 'Search data',
      });
    } else {
      const products = await Products.find(query).toArray(); // getting all products
      res.send({
        status: true,
        data: products,
        message: 'products',
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      data: [],
      message: 'products failed to load',
    });
  }
});

// updating products
app.patch('/products/:id', async (req, res) => {
  try {
    const updateData = req.body;
    const { id } = req.params;

    const filter = { _id: new ObjectId(id) };
    const products = await Products.find(filter);

    const options = { upsert: true };
    const updateDoc = {
      $set: updateData,
    };
    const result = await Products.updateOne(filter, updateDoc, options);

    res.send({
      status: true,
      data: result,
      message: 'product update',
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      data: [],
      message: error,
    });
  }
});

// ADDING NEW PRODUCTS
app.post('/products', async (req, res) => {
  try {
    const productInfo = req.body;
    const result = await Products.insertOne(productInfo);
    res.send({
      status: true,
      data: result,
      message: 'product added',
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      data: [],
      message: error,
    });
  }
});

//deleting product
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const filter = { _id: new ObjectId(id) };
    const result = await Products.deleteOne(filter);

    res.send({
      status: true,
      data: result,
      message: 'product deleted',
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      data: [],
      message: error,
    });
  }
});

// jwt api

app.get('/jwt', async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const user = await User.findOne(query);
  // if (user) {
  const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
    expiresIn: '5d',
  });
  return res.send({ accessToken: token });
  // }
  // res.status(403).send({ accessToken: '' });
});

app.post('/user', async (req, res) => {
  try {
    const userEmail = req.body;
    const result = await User.insertOne(userEmail);
    res.send({
      status: true,
      data: result,
      message: 'user added',
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      data: [],
      message: error,
    });
  }
});

app.get('/', (req, res) => {
  res.send('server is up');
});

app.listen(port, () => {
  console.log('server is running');
});
