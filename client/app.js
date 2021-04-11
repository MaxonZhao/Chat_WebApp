// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)

var index_html = `
    <div class = "content">
      <ul class = "room-list">
        <li><a href="#/chat"><img src = "assets/everyone-icon.png" width="41" height="43" ></a>  <label for="">Everyone in CPEN400A</label></li>
        <li><a href="#/chat"><img src = "assets/bibimbap.jpg" width="41" height="43" ></a> <label for="">Foodies only</label></li>
        <li><a href="#/chat"><img src = "assets/minecraft.jpg" width="41" height="43" ></a> <label for="">Gamers unite</label></li>
        <li><img src = "assets/canucks.png" width="41" height="43" > <a href="#/chat">Canucks Fans</a></li> 
      </ul>
      <div class = "page-control">
        <input type="text" placeholder="Room Title">
        <button>Create Room</button>
      </div>
    </div>
  </div>`;

var chat_html = 
`
    <div class = "content">
        <h4 class = "room-name">Everyone In CPEN400A</h4>
        <div class = message-list>
            <div class = "message">
                <span class = "message-user">Alice</span>
                <span class = "message-text">:Hi guys!</span>
            </div>
            <div class = "message my-message">
                <span class = "message-user">Bob</span>
                <span class = "message-text">:How is everyone doing today?</span>
            </div>
        </div>
        <div class = "page-control">
            <textarea name="mt" id="myTextArea" cols="30" rows="10"></textarea>
            <button>Send</button>
        </div>
    </div>
  </div>
`;

var profile_html = `
  <div id = "page-view">
        <div class = "content">
            <div class = "profile-form">
                 <div class = "form-field">
                    <label for="">Username</label> <input type="text">
                 </div>
                 <div class = "form-field">
                    <label for="">Password</label> <input type="text">
                </div>
                <div class = "form-field">
                    <label for="">Avatar Image</label> 
                    <img src = "assets/profile-icon.png" width="20" height="16" ></a> 
                    <button>Choose File</button>
                    <label for="">No file chosen</label>
                </div>
                <div class = "form-field">
                    <label for="">About</label> <textarea name="mt" id="myTextArea" cols="30" rows="10"></textarea>
                </div>
            </div>
            <div class = "page-control"><button>Save</button></div>
        </div>
  </div>
</div>`;

path_to_chat = "/chat";
var profile = {"username":"Alice"};
const Service = {
    origin:window.location.origin,
    getAllRooms: ()=> {
        var xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) =>{
            xhr.open("GET", Service.origin + path_to_chat, false);
            xhr.onload = ()=> {
                console.log (xhr.responseText);
                // success
                if (xhr.readyState == 4 && xhr.status == 200) {
                    
                    console.log ("Request success");
                    // if (xhr.getResponseHeader("Content-type") == JSON) {
                        // console.log("LINE 81 --------->", xhr.responseText);
                        var result = JSON.parse(xhr.responseText);
                        resolve(result);
                    // }
                } 

                // client-side error
                else if (xhr.status >= 400 && xhr.status < 500) {
                    reject();
                }
                
                // server-side error
                else if (xhr.status >= 500) {
                    reject(new Error(xhr.responseText));
                }
                  
            };

            xhr.send();
        });
    },
    addRoom: function(data) {
        
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', Service.origin + "/chat", false);
           
            xhr.onload = ()=> {
                if (xhr.status == 200) {
                        
                    console.log ("Post Request success");
                    var result = JSON.parse(xhr.responseText);
                    resolve(result);
                } 

                // client-side error
                else if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new Error(xhr.responseText));
                }
                
                // server-side error
                else if (xhr.status >= 500) {
                    reject(new Error(xhr.responseText));
                }
            }
            xhr.setRequestHeader("Content-type", "application/json");
            console.log(data);
            var jsonData = JSON.stringify(data);
            // alert(jsonData);
            
            xhr.send(jsonData);
        })
    },

    getLastConversation : (roomId, before)=> {
        var xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) =>{
            xhr.open("GET", Service.origin + path_to_chat + "/" + roomId + "/messages?before=" + encodeURI(before), false);
            xhr.onload = ()=> {
                console.log (xhr.responseText);
                // success
                if (xhr.readyState == 4 && xhr.status == 200) {
                    
                    console.log ("Request success");
                    // if (xhr.getResponseHeader("Content-type") == JSON) {
                        var result = JSON.parse(xhr.responseText);
                        resolve(result);
                    // }
                } 

                // client-side error
                else if (xhr.status >= 400 && xhr.status < 500) {
                    reject();
                }
                
                // server-side error
                else if (xhr.status >= 500) {
                    reject(new Error(xhr.responseText));
                }
                  
            };

            xhr.send();
        });
    },

    getProfile : ()=> {
        var xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) =>{
            xhr.open("GET", Service.origin + '/profile', false);
            xhr.onload = ()=> {
                console.log (xhr.responseText);
                // success
                if (xhr.readyState == 4 && xhr.status == 200) {
                    
                    console.log ("Request success");
                    // if (xhr.getResponseHeader("Content-type") == JSON) {
                        var result = JSON.parse(xhr.responseText);
                        resolve(result);
                    // }
                } 

                // client-side error
                else if (xhr.status >= 400 && xhr.status < 500) {
                    reject();
                }
                
                // server-side error
                else if (xhr.status >= 500) {
                    reject(new Error(xhr.responseText));
                }
                  
            };

            xhr.send();
        });
    }

};

function* makeConversationLoader(room) {
    var prev_conversation = null;
    var before = room.createdTimeStamp;
    var yield_var = null; 
    while (before > 0 && room.canLoadConversation) {
        room.canLoadConversation = false;
        Service.getLastConversation(room.id, before).then((result) => {
            if (result !== null || result !== undefined) {
                prev_conversation = result;
                before = result.timestamp;
                room.canLoadConversation = true;
                room.addConversation(result);
                yield_var = result;
            } else {
                yield_var = null;
            }
        })
        yield yield_var;
    }
}


function emptyDOM (elem){
	while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM (htmlString){
	let template = document.createElement('template');
	template.innerHTML = htmlString.trim();
	return template.content.firstChild;
}

var LobbyView = function(lobby) {
    this.lobby = lobby;	
    this.elem = createDOM(index_html);
    this.listElem = this.elem.querySelector("ul.room-list");
    this.inputElem = this.elem.querySelector("input");
    this.buttonElem = this.elem.querySelector("button");
    var self = this;
    this.redrawList();

    this.lobby.onNewRoom = function(room) {
        self.lobby.rooms[room.id] = room;
        self.redrawList();
    }

    this.buttonElem.addEventListener("click", function() {
        var text = self.inputElem.value;
        // self.lobby.addRoom(Object.keys(self.lobby.rooms).length+1, self.inputElem.value, "assets/everyone-icon.png", []);
        // console.log(self.inputElem.value);
        // self.inputElem.value = ``;
        var roomdata = {
            name:self.inputElem.value,
            image:'assets/everyone-icon.png'
          }
          Service.addRoom(roomdata).then(
           (result) => {
             lobby.addRoom(result._id,result.name,result.image,result.messages);
             self.inputElem.value = "";
           }
          )
    });

    
}

LobbyView.prototype.redrawList = function() {
    emptyDOM(this.listElem);

    var newRoom_html = ``;
    for (var key in this.lobby.rooms) {
        var newRoom = this.lobby.rooms[key];
        console.log(newRoom.name);
        var room_name = newRoom.name;
        var room_img = newRoom.img;
        var room_messages = newRoom.room_messages;
        newRoom_html = `<li><a href="#/chat/${key}"><img src ="${room_img}" width="41" height="43" ></a>  <label for="">
        ${room_name}</label></li>`; 

        this.listElem.appendChild(createDOM(newRoom_html));
    }
    
};

var Room = function(id, name, image = "assets/everyone-icon.png", messages = []) {	
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
    this.canLoadConversation = true;
    this.createdTimeStamp = Date.now();
    this.getLastConversation = makeConversationLoader(this);
}

Room.prototype.addMessage = function(username, text) {
    // var mesObj = {"username":username, "text":text};
    // if (text.trim() == "") {
    //     return; 
    // } else {
    //     this.messages.push(mesObj);
    // }
    // if (this.onNewMessage != null) this.onNewMessage(mesObj);
    if(text.trim().length == 0) return;
    else{ 
        let message = {username: username, text: text}
        if(text.includes("<img") || text.includes("<button") || text.includes("</button") || text.includes("<div")){
            message.text = " ";                
        }
        this.messages.push(message);
        if(typeof this.onNewMessage === typeof Function){
            this.onNewMessage(message);
        }
    }
}

Room.prototype.addConversation = function(conversation) {
    var conversation_messages = conversation.messages;
    var conversation_messages_concat = conversation_messages.concat(this.messages);
    this.messages = conversation_messages_concat;
    this.onFetchConversation(conversation);
}


var ChatView = function(socket) {	
    this.elem = createDOM(chat_html);
    this.titleElem = this.elem.querySelector("h4.room-name");
    this.chatElem = this.elem.querySelector("div.message-list");
    this.inputElem = this.elem.querySelector("textarea");
    this.buttonElem = this.elem.querySelector("button");
    this.socket = socket;
    this.room = null;
    var self = this;
    this.buttonElem.addEventListener("click", function() {
        self.sendMessage();
    });

    this.inputElem.addEventListener("keyup", function(e) {
        if ((e.key == 'Enter') && (!e.shiftKey)) self.sendMessage();
    });

    this.chatElem.addEventListener('wheel', function(e) {
        if (self.chatElem.scrollTop == 0 && e.deltaY < 0 && self.room.canLoadConversation) {  //&& e.deltaY > 0
            self.room.getLastConversation.next();
        }
    });
}

ChatView.prototype.sendMessage = function() {
    var text = this.inputElem.value;
    this.room.addMessage(profile.username, text);
    var msg = {
        roomId: this.room.id,
        username: profile.username,
        text: this.inputElem.value
    };
    this.inputElem.value = ``;
    var jsonData = JSON.stringify(msg);
    this.socket.send(jsonData);
}

ChatView.prototype.setRoom = function(room) {
    this.room = room;
    emptyDOM(this.titleElem);
    this.titleElem.innerHTML = room.name;
    var self = this;
    emptyDOM(this.chatElem);
    this.room.messages.forEach(msg => {
        if (msg.username == profile.username) {
            this.chatElem.appendChild(createDOM(`<div class = my-message> <span class = "message-user">${msg.username}</span>
                       <span class = "message-text">${msg.text}</span> </div>`));
        } else {
            this.chatElem.appendChild(createDOM(`<div class = message><span class = "message-user">${msg.username}</span>
                       <span class = "message-text">${msg.text}</span></div>`));
        }
    });


    this.room.onNewMessage = function(message) {
        // var test = message.text.split('<script>');

        let text = message.text;
            if(text.includes("<img") || text.includes("<button") || text.includes("</button") || text.includes("<div")){
                message.text = " ";                
            }
            if(message.username == profile.username){
                self.chatElem.appendChild(createDOM(
                    `
                    <div class="message my-message">
                            <span class="message-user">${message.username}</span>
                            <span class="message-text">${message.text}</span>
                    </div>
                    `
                ));
               }
               else{
                self.chatElem.appendChild(createDOM(
                    `
                    <div class="message">
                            <span class="message-user">${message.username}</span>
                            <span class="message-text">${message.text}</span>
                    </div>
                    `
                ));
               }
    }

    this.room.onFetchConversation = function(conversation) {
        var msgs = conversation.messages.reverse();
        var height = self.chatElem.scrollHeight;
        msgs.forEach(message => {
            if (message.username == profile.username) {
                self.chatElem.prepend(createDOM(`<div class = my-message><span class = "message-user">${profile.username}</span>
                           <span class = "message-text">${String(message.text)}</span></div>`));
            } else {
                self.chatElem.prepend(createDOM(`<div class = message><span class = "message-user">${message.username}</span>
                           <span class = "message-text">${message.text}</span></div>`));
            }
    
            self.chatElem.scrollHeight += 50;
            
        });
        self.chatElem.scrollTop = self.chatElem.scrollHeight - height;
        conversation.messages.reverse();
    }
}

var ProfileView = function() {	
	this.elem = createDOM(profile_html);
}



var Lobby = function() {	
    this.rooms = {};
}

Lobby.prototype.getRoom = function(roomId) {
    return this.rooms[roomId];
}

Lobby.prototype.addRoom = function(id, name, image, messages) {
    var newRoom = new Room(id,name, image, messages);                                             
    this.rooms[id] = newRoom;
    if (this.onNewRoom != null) this.onNewRoom(newRoom);
}

function main() {
    
    var lobby = new Lobby();
    var lobbyView = new LobbyView(lobby);
    
    var profileView = new ProfileView();
    var socket = new WebSocket("ws://localhost:8000");
    socket.addEventListener("message", (event)=> {
        // the message is a serialized JSON string and will have three fields: roomId, username, text
        // alert(`[message] Data received from server: ${event.data}`);
        var msg = JSON.parse(event.data);
        var roomId = msg.roomId;
        var username = msg.username;
        var text = msg.text;
        var room = lobby.getRoom(roomId);
        room.addMessage(username, text);
    });
    var chatView = new ChatView(socket);
    var self = this;
    renderRoute = function() {
        var url_hash = window.location.hash;
        var url_array = url_hash.split("/");
        var firstPart = url_array[1];
        var room_id = url_array[2];
        var page_view = document.getElementById("page-view");
        
        // alert(firstPart);
    
        if (firstPart == "") {
            emptyDOM(page_view);
            page_view.appendChild(lobbyView.elem);
        } else if (firstPart == "chat") {
            emptyDOM(page_view);
            page_view.appendChild(chatView.elem);
            var r = lobby.getRoom(room_id);
            if (r != null) chatView.setRoom(r);
        } else if (firstPart == "profile") {
            emptyDOM(page_view);
            page_view.appendChild(profileView.elem);
        }  
    }
    
    var refreshLobby = function() {
        /* 1.call the getAllRooms function you just created to make an AJAX request to the server. 
        When the returned Promise resolves, update lobby.rooms object by iterating through the array of rooms just received from the server. 
        Note that the server returns an Array while lobby.rooms is an Object (associative array). Make sure you do not replace the lobby.
        rooms object itself, but rather update each individual Room instances inside it. If a Room already exists, update the name and image. 
        If a Room does not exist, call lobby.addRoom method to add the new room.*/
        // Service.getAllRooms();
        Service.getAllRooms().then( (result) => { 
                console.log(result); 
                // iterate through the JSON object
                result.forEach(element => {
                    if (lobby.rooms[element._id] == null) {
                        lobby.addRoom(element._id, element.name, element.image, element.messages);
                    } else {
                        lobby.rooms[element._id].name = element.name;
                        lobby.rooms[element._id].image = element.image;
                        lobby.rooms[element._id].messages = element.messages;
                    }
                });
            });
    }; 
 
    Service.getProfile().then( (result) => { 
        
        console.log(result);
        if(result.username != null)
            profile.username = result.username;
    });
 
    renderRoute();
    refreshLobby();
    setInterval(refreshLobby, 10000);
    
    window.addEventListener("popstate", renderRoute);
    

    cpen400a.export(arguments.callee, {
        renderRoute: renderRoute,
        lobbyView: lobbyView,
        chatView:chatView,
        profileView:profileView,
        refreshLobby: refreshLobby,
        lobby,
        socket
    });
    
}


window.addEventListener("load", main);

