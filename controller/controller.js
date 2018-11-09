var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');


module.exports = function (app,io){
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });

    var handle=null;
    var private=null;
    var users={};
    var keys={};

    app.post('/login',function(req,res){
        console.log(req.body.handle);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.handle;
        models.online.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                res.send(err);
            }
            if(doc != null){
                res.send("This Name is already taken, please chose an other one");
            }
            else {
                console.log("Asas"+__dirname);
                res.send("success");
            }
        });
    });

    io.on('connection',function(socket){
        console.log("Connection :User is connected  "+handle);
        console.log("Connection : " +socket.id);
        io.to(socket.id).emit('handle', handle);
        users[handle]=socket.id;
        keys[socket.id]=handle;
        console.log("Users list : "+users);
        console.log("keys list : "+keys);


        socket.on('group message',function(msg){
            console.log(msg);
            io.emit('group',msg);
        });

        socket.on('private message',function(msg){
            console.log('message  :'+msg.split("#*@")[0]);
            models.messages.create({
                "message":msg.split("#*@")[1],
                "sender" :msg.split("#*@")[2],
                "reciever":msg.split("#*@")[0],
                "date" : new Date()});
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg);
        });

        socket.on('disconnect', function(){
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);
            console.log(users);
        });
    });
}
