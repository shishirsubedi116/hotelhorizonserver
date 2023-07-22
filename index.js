//Server Root file

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;

//config and database connection
require('dotenv').config();
require('./db/connection');

//Express Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static('public'));
app.use(express.json());
app.use(cors());

//Routes
app.use('/api/auth', require('./routers/auth'));
app.use('/api/room', require('./routers/room'));
app.use('/api/booking', require('./routers/book'));
app.use('/api/admin', require('./routers/admin'));

//Listening to the server
app.listen(port, () => {
    console.log('Server running...');
})


// http://localhost:5000/public/rooms/1675964195296_logo.png