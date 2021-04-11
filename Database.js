const { response } = require('express');
const { MongoClient, ObjectID } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){
	// console.log("entered getRooms function");
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */

			const res = await db.collection("chatrooms").find({}).toArray();
			resolve(res);
		})
	)
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			// console.log("entered getRoom --------------------------------------- ");
			const res = await db.collection("chatrooms").find({}).toArray();
			res.forEach(room => {
				// console.log(room);
				// console.log(room_id);
				// console.log(typeof room_id == 'string')
				// console.log(room._id == room_id)
 
				// console.log(typeof room_id == mongo.ObjectID);
				if (room._id == room_id) resolve(room);
				else if (typeof room_id == 'object') {
					console.log('room_id ------------> ', room_id.room_id);	
					if (room._id == room_id.room_id) resolve(room);
				} 
					

			});
			resolve(null);
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			if (room.name == null) reject(new Error("HTTP 400 Bad Request"));
			else {
				db.collection("chatrooms").insertOne(room, function(err, res) {
					if (err) throw err;
					if (room._id != null) resolve(room);
					else {
						// console.log('inserted record ', res.insertedId);
						room._id = res.insertedId;
						resolve(room);
					}
				});
			}
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			// console.log('room_id -----> ', room_id);
			// console.log('before -----> ', timestamp);
			var conversations = [];
			var timestamp = before;
			if (before == null) timestamp = Date.now();
			// console.log('room_id -----> ', room_id);
			// console.log('before -----> ', timestamp);
			
			const res = await db.collection("conversations").find({}).toArray();
			res.forEach(conversation => {
				if (typeof room_id == 'object') {
					// console.log("LINE 109: room_id ===========================", room_id);
					// console.log("LINE 110: room_id ===========================", conversation.room_id);
					// console.log(conversation.room_id == room_id.room_id);
					if (conversation.room_id == room_id.room_id && conversation.timestamp < timestamp) conversations.push(conversation);
				} 
				else if (conversation.room_id == room_id && conversation.timestamp < timestamp) {
					// console.log("LINE 115: room_id ===========================", conversation.room_id);
					conversations.push(conversation);
				}
				// console.log('conversation =========', conversation.room_id);
			});
			console.log('printing conversation length ------>', conversations.length);
			
			if (conversations.length == 0) {
				console.log("not found ^^^^^^^^^^^^^^^^^^^^^^");
				resolve(null);
			}
			else {
				// console.log("getting there --------------------");
				var closest_time = timestamp;
				var index = -1;
				for (var i = 0; i < conversations.length; ++i) {
					if (timestamp - conversations[i].timestamp < closest_time) {
						closest_time = timestamp - conversations[i].timestamp;
						index = i;
					}
				}
				// console.log('index -------------->', index);
				// console.log("LINE 137: conversation ===========================");
				console.log(conversations[index]); 
				resolve(conversations[index]);
			}
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			if (conversation.room_id == null || conversation.timestamp == null || conversation.messages == null) reject(new Error("fields missing"));
			else {
				db.collection("conversations").insertOne(conversation, function(err, res) {
					if (err) throw err;
					else resolve(res.ops[0]);
				});
			}
		})
	)
}

Database.prototype.getUser = function(username) { 
	return this.connected.then(db =>
		new Promise(async (resolve, reject) => {
			const res = await db.collection("users").find({}).toArray();
			res.forEach(user => {
				if (user.username == username) {
					// console.log('USER FOUND !' + user.password);
					resolve(user);
				}
			});
			resolve(null);
		})
	)
}

module.exports = Database;