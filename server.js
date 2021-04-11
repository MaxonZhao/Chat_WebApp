const cpen400a = require('./cpen400a-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { stringify } = require('querystring');
const e = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

var Database = require("./Database.js");
var SessionManager = require("./SessionManager.js");
const { restart } = require('nodemon');
var db = new Database("mongodb://localhost:27017", "cpen400a-messenger")

var sessionManager = new SessionManager();

const broker = new WebSocket.Server({ port: 8000 });
function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const messageBlockSize = 10;

// declare and initialize messages
var messages = {};

function getMessages() {
	db.getRooms().then((rooms) => {
		rooms.forEach(room => {
			messages[room._id] = [];
			// console.log(room._id);
		})
		// console.log(messages);
	});
}

getMessages();


function middleware_errorHandler(err, req, res, next) {
	console.log("reached line 71");
	console.error(err);
	if (err instanceof SessionManager.Error) {
		// let idx = 0;
		let format;

		format = req.headers.accept;
		console.log('reached line 83 ------>', format);
		if (format == "application/json") res.status(401).json(err);
		else res.redirect('/login');
	} else {
		res.status(500).send();
	}
}

function isCorrectPassword(password, saltedHash) { 
	var salt = saltedHash.substring(0,20);
	var SHA256 = saltedHash.substring(20);
	var input_cwd = crypto.createHash("sha256").update(password + salt).digest("base64");
	return input_cwd == SHA256;
}

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug


app.use('/chat/:room_id/messages', sessionManager.middleware);
app.use('/chat/:room_id', sessionManager.middleware);
app.use('/chat', sessionManager.middleware);


app.use('/profile', sessionManager.middleware);

app.route('/chat')
.get(function(req, res, next) {
	var result = [];
	db.getRooms().then((rooms) => {
		rooms.forEach(room => {
		
			result.push({
				"_id": room._id,
				"name": room.name,
				"image": room.image,
				"messages":messages[room._id]
			});
		})
		console.log('LINE 95 --------------> ', result);
		res.status(200).json(result);
	}).catch(err => res.status(404).send(err));
})
.post(function(req, res, next) {
	console.log(req.body)
	db.addRoom(req.body).then((result) => {
		getMessages();
		res.status(200).json(result);
	},
	(reject) => {
		res.status(400).send(reject); 
	});
});

// newly added endpoint for /chat/:room_id
app.route('/chat/:room_id')
.get(function(req, res, next) {
	db.getRoom(req.params).then((room) => {
		
		if (room != null) {
			// console.log(room._id);
			res.status(200).json(room);
		}
		else res.status(404).json("Room X was not found");
	})
})

// newly added endpoint for /login
app.route('/login')
.post(function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	var maxAge = req.body.maxAge;
	// console.log('req at endpoint is ' + JSON.stringify(req.body));
	db.getUser(username).then((user) => {
		if (user != null) {
			// console.log(" LINE 103 ------------------------- ");
			let passwordMatch;
			if (maxAge == null)
				passwordMatch = isCorrectPassword(password, user.password);
			else passwordMatch = isCorrectPassword(password, user.password, maxAge);

		    if (passwordMatch) {
				// console.log(" LINE 104 ------------------------- ");
				sessionManager.createSession(res, username);
				res.redirect('/')
			} else {
				res.redirect('/login')
			}
		}
		else res.redirect('/login');
	})
})


// newly added endpoint for /chat/:room_id/messages
app.route('/chat/:room_id/messages')
.get(function(req, res, next) {

	// console.log('parameters ------> ', req.params);
	var roomId = req.params.room_id
	var before = parseInt(req.query.before);
	if (req.query.before == null) before = Date.now();
	// console.log('reached LINE 157-------->', JSON.stringify(req));
	db.getLastConversation(roomId, before).then((conversation) => {
		
		if (conversation != null) {
			// console.log(room._id);
			res.status(200).json(conversation);
		}
		else res.status(404).json("conversation was not found");
	})
	// res.status(404).json("conversation was not found"); 
})

app.route('/profile')
.get(function(req, res, next) {
	// console.log('LINE 171 ---------->', req.username);
	var obj = new Object();
	obj.username = req.username;
	res.status(200).send(obj); 
})

app.route('/logout')
.get(function(req, res, next) {
	// console.log('LINE 180 ---------->', req);
	sessionManager.deleteSession(req);
	res.redirect('/login'); 
})
// app.use(express.json()) 				 		// to parse application/json
// app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
// app.use(logRequest);							// logging for debug



app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
})

broker.on('connection', function connection(ws, request) {
	var cookie = request.headers.cookie;
	if (cookie != null) cookie = cookie.split('=')[1];
	if (cookie == null || sessionManager.getUsername(cookie) == null) {
			broker.clients.forEach(function each(client) {
				if (client == ws && client.readyState === WebSocket.OPEN) {
					client.close();
				}
			});
	}
	ws.on('message', function incoming(data) {
		var temp = JSON.parse(data);
		if(temp.text.includes("<img") || temp.text.includes("<button") || temp.text.includes("</button") || temp.text.includes("<div")){
			temp.text = " ";                
		} 
		temp.username = sessionManager.getUsername(cookie);
		data = JSON.stringify(temp);
		broker.clients.forEach(function each(client) {
			if (client != ws && client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
		var msg = JSON.parse(data);
		messages[msg.roomId].push(msg);
		if (messages[msg.roomId].length >= messageBlockSize) {
			var conversation = {room_id:msg.roomId, timestamp:Date.now(), messages:messages[msg.roomId]};
			db.addConversation(conversation).then(()=> {
				messages[msg.roomId] = [];
			});
		}
	});	
});




// serve static files (client-side)
app.use('/app.js', sessionManager.middleware, express.static(clientApp + '/app.js'));
app.use('/index.html', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use('/index', sessionManager.middleware, express.static(clientApp + '/index.html'));
app.use('[/]', sessionManager.middleware, express.static(clientApp + '[/]'));

app.use('/', express.static(clientApp, { extensions: ['html'] }));




// app.use(sessionManager.middleware);
app.use(middleware_errorHandler);
// app.use(sessionManager.middleware_errorHandler);

cpen400a.connect('http://35.183.65.155/cpen400a/test-a5-server.js');
cpen400a.export(__filename, { 
		app,
		messageBlockSize,
		messages,
		broker,
		db,
		sessionManager,
		isCorrectPassword
							 });

