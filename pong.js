/* LOADING THE MODULES NEEDED TO RUN THE WEBSERVER */
const express = require('express')			// module used to create the web server
    , path = require('path')				// module used to get the absolute path of a file
    , bodyParser = require('body-parser')	// module used to parse what the cliend sent
    , http = require('http')				// module used to talk to a client
    , request = require('request')
    , Io = require('socket.io')
    ;


/* GLOBAL CONSTANTS */
const app = express()						// Creating a variable: app, to receive and respond to client's requests
    , port = 8000							// Defining what port to use to talk to the client
    , server = http.createServer(app)		// Creating the web server and storing it in a variable: app
    , io = Io(server)
    ;

let players = [];

/* MIDDLEWARE TO LOOK AT THE REQUEST BEFORE HANDLING IT */
app.use(bodyParser.json({					// Limiting the amount of data the client can send to 50mb
    limit: '50mb'
}));

app.use(bodyParser.urlencoded({ 			// Allowing the body parser to parse many different types of requests
    extended: true
}));


/* ROUTES TO HANDLE THE REQUEST */
app.get('/', (req, res, next) => {			// Recieving a request from the client when there is no path
    request.get('https://guest4.wisen.space/pong.html').pipe(res);
});


function startSocketServer() {
    io.on('connection', function (socket) {
        console.log('SOMEONE CONNECTED');

        players.push(socket);
        console.log(players.length);

        if(players.length > 2)
        {
            // only person on this socket receive message
            socket.emit('goaway', 'go away');
        }

        
        if(players.length === 2)
        {
            // both players receive message
            io.emit('start', 'start game');
        }

        if(players.length === 1)
        {
            socket.emit('waiting', 'bring your friends');
        }

        // LETS DETERMINE WHEN THE USER DISCONNECTS
        socket.on('disconnect', function () {
            console.log('SOMEONE DISCONNECTED');
            console.log("socket = "+socket.id)
            players = players.filter(player => player.id !== socket.id);
            console.log(players.length);
        });

    });
}

function startServer() {
    startSocketServer();
    server.on('listening', () => {				// Calling a function when the server starts listening for requests
        var addr = server.address()
            , bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port
            ;
        console.log('Listening on ' + bind);	// Logging a message to terminal
    });
    server.listen(port);						// Telling the server to start listening
}

startServer();