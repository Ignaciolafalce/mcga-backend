const express = require('express');
const mongoose = require('mongoose');
const consola = require('consola');
const cors = require('cors');
const path = require('path');
const app = express();
const { logErrors, wrapErrors, errorHandler } = require('./utils/middlewares/errorHandlers');
const notFoundHandler = require('./utils/middlewares/notFoundHandler');
const authApi = require('./routes/authApi');
const boardsApi = require('./routes/boardsApi');
const noteApi = require('./routes/notesApi');

//Config constants
const { SERVER_PORT, SERVER_RESTART_AT_ms, MONGODB_CONNECTION_URI } = require('./config');

//express static files
app.use("/", express.static("./build"));

// cors
app.use(cors());

//content type json
app.use(express.json());

// Api routes
authApi(app);
boardsApi(app);
noteApi(app);

//send index.html for all the others get routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './build/index.html'));
}
);

// Catch 404
app.use(notFoundHandler);

// Errors middleware
app.use(logErrors);
app.use(wrapErrors);
app.use(errorHandler)

//start/restart application function
async function startApp(restart = true) {
    try {
        //Connection with DB
        await mongoose.connect(MONGODB_CONNECTION_URI, { useFindAndModify: true, useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
        consola.success({ message: `Succesfully connected with the database`, badge: true });

        //app start listening 
        app.listen(SERVER_PORT, () => consola.success({ message: `Server started at PORT ${SERVER_PORT}`, badge: true }));

    } catch (err) {
        consola.error({ message: `Unable to connect with the database: \n${MONGODB_CONNECTION_URI} \n${err}`, badge: true });

        //app restarts
        if (restart) {
            console.log(`Server will restart at ${(SERVER_RESTART_AT_ms / 60) / 1000} minutes`);
            setTimeout(() => appStart(), SERVER_RESTART_AT_ms);
        }
    }
}

//init start application
startApp(true);