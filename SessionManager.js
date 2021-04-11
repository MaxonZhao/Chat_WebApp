const crypto = require('crypto');

class SessionError extends Error {};

function SessionManager (){
	// default session length - you might want to
	// set this to something small during development
	const CookieMaxAgeMs = 600000;

	// keeping the session data inside a closure to keep them protected
	const sessions = {};

	// might be worth thinking about why we create these functions
	// as anonymous functions (per each instance) and not as prototype methods
	this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
		/* To be implemented */
		var token = crypto.randomBytes(100).toString("hex");
		var request = {username:username, timestamp:Date.now(), expire_timestamp:(Date.now() + maxAge)};
		sessions[token] = request;

		response.cookie('cpen400a-session',token, {maxAge: maxAge});
		setTimeout(function(){delete sessions[token];}, maxAge); 
	};

	this.deleteSession = (request) => {
		/* To be implemented */
		// console.log('deleting session ----------> ');
		let cookie = request.session;
		delete request.username;
		delete request.session;
		if (cookie != null) {
			delete sessions[cookie];
		}
	};

	this.middleware = (request, response, next) => {
		/* To be implemented */
		
		var cookie = null;
		

		cookie = request.headers.cookie; 
		if (cookie == null) {
			next(new SessionError('no cookie')); // Express will catch this on its own.
		} else {
			// cookie = cookie.split('=')[1];
			cookie = cookie.split(';').map(s => s.split('=').pop().trim()).shift();
			console.log('LINE 43 ------------->', cookie);
			// console.log('reached line 52 ---------------------- ', sessions);
			
			if (sessions[cookie] == null) next(new SessionError('no cookie'));
			else {
				console.log('reached line 48 ---------------------- ');
				// request.body.args.push(sessions[cookie].username);
				request.username = sessions[cookie].username;
				// console.log('request rawHeaders------------->', request.body.args);
				request.session = cookie;
				console.log('request session------------->', request.session);
				next();
			}
		}
	};

	this.middleware_errorHandler = (err, req, res, next) => {
		console.log("reached line 71");
		console.error(err);
		if (err instanceof SessionError) {
			// let idx = 0;
			let format;

			format = req.headers.accept;
			console.log('reached line 67 ------>', format);
			if (format == 'application/json') res.status(401).json(err);
			else res.redirect('/login');
		} else {
			res.status(500).send();
		}
	}

	// this function is used by the test script.
	// you can use it if you want.
	this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;