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
    , port = process.env.PORT ||8000		// Defining what port to use to talk to the client
    , server = http.createServer(app)		// Creating the web server and storing it in a variable: app
    , io = Io(server)
    ;

let speed = 1;
let leftPosition = 44;
let rightPosition = 44;
let paddleHeight = 12;
let leftSpeed = 0;
let rightSpeed = 0;
let ballSpeed = 1;
let angle;
let direction;
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

        // we use socket to represent each player, which will be distinguish for each player
        players.push(socket);
        
        console.log(players.length);

        // if we have more than two players
        if(players.length > 2)
        {
            // only person on the socket receive message from channel 'goaway'
            socket.emit('goaway', 'go away');
        }

        // if we have two players
        if(players.length === 2)
        {
            // random choose a number that is -1 or 1
            direction = Math.random() <=0.5 ? -1 : 1;

            // random choose a number between -pi/4 to pi/4
            angle = ((Math.random() - 0.5)*Math.PI*2)/3;

            // both players receive message, from channel 'start'
            io.emit('start', {speed, 
                                leftPosition, 
                                rightPosition, 
                                paddleHeight, 
                                leftSpeed,
                                rightSpeed, 
                                angle, 
                                direction, 
                                ballSpeed});
        }

        // if we only have one player
        if(players.length === 1)
        {
            // only one player receive message, from channel 'waiting'
            socket.emit('waiting', 'bring your friends');
        }

        // LETS DETERMINE WHEN THE USER DISCONNECTS
        socket.on('disconnect', function () {
            console.log('SOMEONE DISCONNECTED');
            console.log("socket = "+socket.id)

            // javascript way to remove a player
            // socket has an element of id.
            players = players.filter(player => player.id !== socket.id);
            console.log(players.length);
        });

        // use leftSpeed and rightSpeed to control how leftPaddle and rightPaddle move
        socket.on('leftPaddleUp', function() {
            leftSpeed = -1*speed;
            io.emit('leftPaddleUp',  {leftSpeed});

        });

        socket.on('leftPaddleStop', function() {
            leftSpeed = 0;
            io.emit('leftPaddleStop',  {leftSpeed});
        });

        socket.on('leftPaddleDown', function() {
            leftSpeed = speed;
            io.emit('leftPaddleDown',  {leftSpeed});
        });

        socket.on('rightPaddleUp', function() {
            rightSpeed = -1*speed;
            io.emit('rightPaddleUp',  {rightSpeed});
        });

        socket.on('rightPaddleStop', function() {
            rightSpeed = 0;
            io.emit('rightPaddleStop',  {rightSpeed});
        });

        socket.on('rightPaddleDown', function() {
            rightSpeed = speed;
            io.emit('rightPaddleDown',  {rightSpeed});
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