/* Created by hxsd on 2016/11/9.*/

// 引入相关的模块
var http = require("http");
var path = require("path");
var express = require("express");

var app=express();

// 处理对静态资源的请求
var staticPath = path.resolve(__dirname, "public");  // 解决文件路径跨平台
app.use(express.static(staticPath));

var httpServer=http.createServer(app)

//引入socket.io模块
var socketIO=require("socket.io");

//让socket.io监听http服务器，并返回socket.io
var socketServer=socketIO.listen(httpServer);

// 创建服务器
httpServer.listen(3000, function () {
    console.log("服务器正运行在3000端口...");
});
var database={};//构建一个包含所有已经登陆的用户信息的数据库
//socket服务器会监听所有客户端的连接请求
//当有客户端连接请求到达时，对触发一个connect事件
//每一个客户端请求，服务器都会创建一个新的socket对象，负责和对方通信
socketServer.on("connect", function (socket) {
    console.log('有新的客户端连接：'+socket.id);
    socket.num=socket.server.eio.clientsCount;
    //向客户端发送消息
    //有两个方法：1）send-发送的是默认叫"message"的消息；2）emit-发送自定义名称的消息
    //参数1：消息名称；参数2：消息内容
    //socket.emit("hello","欢迎新朋友！");

    //socket服务器监听客户端发过来的消息
    socket.on("message", function (data) {
        //提取接收到的消息类型
        var type=data.type;
        //根据收到的消息类型，做不同的处理
        switch (type){
            case "101"://用户登录信息
                handleUserLogin(socket,data);
                break;
            case "201"://用户公共聊天信息
                handleChatMsg(socket,data);
                break;
        };
    });

    //处理用户离开——disconnect
    socket.on("disconnect", function () {
        delete database[socket.nickname];//将其信息从用户数据库里删除

        //把用户离开的消息群发（包括昵称）
        socket.num=socket.server.eio.clientsCount;
        var message={
            type:"102",//用户离开聊天室
            nickname:socket.nickname,
            num:socket.num
        };
        socket.broadcast.send(message);

        console.log("客户端断开连接："+socket.id);
    });
});

//每隔一秒向所有的客户端发送当前标准时间
setInterval(function () {
    var now=new Date().toLocaleString();
    //发送
    var content={
        type:"301",
        now:now
    };
    socketServer.sockets.send(content);
},1000);

//处理用户登录的方法
function handleUserLogin(socket,data){
    //保存用户信息到socket对象中
    socket.nickname=data.nickname;
    socket.gender=data.gender;
    socket.state=data.state;
    socket.imgPath=data.imgPath;
    //构造一个群发的消息格式
    var content={
        type:"101",//代表用户登录
        nickname:socket.nickname,
        gender:socket.gender,
        state:socket.state,
        imgPath:socket.imgPath,
        num:socket.num
    };

    database[socket.nickname]={gender:socket.gender, state:socket.state, imgPath:socket.imgPath};

    //将新用户登录的消息群发给聊天室内所有的用户
    //socket.broadcast.send会群发消息给所有的客户端socket，除了自己
    socket.broadcast.send(content);

    //将消息发送给自己
    content.type="100";//表示是自己进入了聊天室
    content.database=database;
    socket.send(content);//谁登陆，发给谁
};

//处理用户公共聊天信息
function handleChatMsg(socket,data){
    //群发该信息，先构造数据结构
    var message={
        type:"201",//是聊天信息
        content:data.content,
        nickname:socket.nickname//从socket中取出登录时保存的nickname
    };
    socket.broadcast.send(message);

    //将消息发送给自己
    message.type="200";//表示是自己发的消息
    socket.send(message);//谁发的，发给谁
};





