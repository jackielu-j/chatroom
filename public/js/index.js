/**
 * Created by hxsd on 2016/11/12.
 */
$(function () {
    //和socket服务器建立连接，获得客户端的socket对象
    //会发起向服务器的连接请求
    var clientSocket=io();
    var isLogin=false;

    //监听服务器端发过来的消息
    //clientSocket.on("hello", function (data) {});

    //客户端socket监听服务器端发过来的消息
    clientSocket.on("message", function (data) {
        var type=data.type;//提交消息类型

        if(type=="301"){$("#time").html(data.now)};

        //根据消息类型，做出相应的处理
        switch (type){
            case "100"://自己进入聊天室
                isLogin=true;
                showChatPanel(data);//登陆聊天界面
                break;
            case "101"://系统消息，有新用户加入
                if(isLogin){showWelcomeMsg(data);showUsers(data);};//显示欢迎新用户的消息
                break;
            case "102"://系统信息，用户离开聊天室
                if(isLogin) showUserLeaving(data);
                break;
            case "200"://自己发聊天信息
                if(isLogin) showSelfChatMsg(data);
                break;
            case "201"://其他用户的聊天信息
                if(isLogin) showChatMsg(data);
                break;
        };
    });

    //登陆聊天界面
    function showChatPanel(data){
        //隐藏登陆界面
        $(".modal").hide();
        $(".loginBox").hide();
        //显示聊天界面
        $('.chatroom').show();
        //在聊天界面给出提示信息
        var enter="<div class='loginMsg'>[系统消息] 您已经进入聊天室，请文明发言!</div>";
        $("#messages").append(enter);
        //右侧信息
        $(".myselfPic").attr("src",data.imgPath);
        $(".myNickname").html(data.nickname);
        //左侧信息
        var user="<li class='clearfix'><div class='memPic'><img src='"+data.imgPath+"'/></div><p data-cont="+data.nickname+"(我)>"+data.nickname+"</p><p><img class='sex' src="+data.gender+"></p><p class='statenow'>"+data.state+"</p></li>";
        $("#myself").append(user);
        //显示当前用户列表
        for(var name in data.database){
            if(name!=data.nickname){
                var user="<li class='clearfix members'><div class='memPic'><img src='"+data.database[name].imgPath+"' title='私聊' class='memberPic'/></div><p data-cont="+name+" class='membername'>"+name+"</p><p><img  class='sex' src="+data.database[name].gender+"></p><p class='statenow'>"+data.database[name].state+"</p></li>";
                $("#others").append(user);
            };
        };
        $(".num").html("当前在线人数："+data.num+"人")
    };

    //显示欢迎新用户的消息
    function showWelcomeMsg(data){
        //在聊天界面给出提示信息
        var welcome="<div class='loginMsg'>[系统消息] 欢迎"+data.nickname+"进入聊天室！</div>";
        $("#messages").append(welcome);
        $(".num").html("当前在线人数："+data.num+"人")
        scroll();
    };

    //实时更新当前用户列表
    function showUsers(data){
        //在聊天界面给出提示信息
        var user="<li class='clearfix members'><div class='memPic'><img src='"+data.imgPath+"' title='私聊'/></div><p data-cont="+data.nickname+" class='membername'>"+data.nickname+"</p><p><img  class='sex' src="+data.gender+"></p><p class='statenow'>"+data.state+"</p></li>";
        $("#others").append(user);
    };

    //系统信息，用户离开聊天室
    function showUserLeaving(data){
        if(data.nickname){//排除该用户没有登陆的情况，否则会出现undefined
            var leave="<div class='loginMsg'>[系统消息] "+data.nickname+"离开了聊天室</div>";
            $("#messages").append(leave);
        };
        $("#others").find('p[data-cont='+data.nickname+']').parent().remove();
        $(".num").html("当前在线人数："+data.num+"人");
        scroll();
    };

    //自己发聊天信息
    function showSelfChatMsg(data){
        var selfChatMsg="<div class='msg clearfix'><div class='wo'>[我]</div><div class='selfMsg'>"+data.content+"<span></span></div></div>";
        $("#messages").append(selfChatMsg);
        scroll();
    };

    //其他用户的聊天信息
    function showChatMsg(data){
        //在聊天界面给出提示
        var chatMsg="<div class='msg clearfix'><div class='users'>["+data.nickname+"]</div><div class='othersMsg'>"+data.content+"<span></span></div></div>";
        $("#messages").append(chatMsg);
        scroll();
    };

    //滚动条适应
    function scroll(){
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    };

    //响应用户登录事件
    $("#startchat").on("click", function () {
        //获取用户的昵称
        var nickname= $.trim($('#nickname').val());
        var gender=$("input[name=gender]:checked").val();
        var state=$("input[name=state]:checked").val();
        var imgPath=$(".chosedimg img").attr("src");

        //对昵称进行合法性验证
        var keywords=["习近平","彭丽媛"];//敏感词库
        for(var i=0;i<keywords.length;i++){
            var re=new RegExp(keywords[i],"g");
            if(nickname.indexOf(keywords[i])!=-1){
                var result=nickname.replace(re,"***");
                nickname=result;
                $('#nickname').val(result);
                alert("您输入的昵称中包含敏感字符，请重新输入！");
                return;
            };
            if(nickname==""){
                alert("请输入昵称！");
                return;
            };
        };

        //构造要发给服务器端的消息内容
        var content={
            type:"101",//代表用户登录
            nickname:nickname,
            gender:gender,
            state:state,
            imgPath:imgPath
        };
        //发送登陆信息给服务器端
        clientSocket.send(content);//send默认发送的是message
    });

    //发送聊天内容
    $('#send').on("click", function () {
        //获取用户输入的聊天内容
        var content= $.trim($("#message").val());

        //验证内容的合法性
        var keywords=["习近平","彭丽媛"];//敏感词库
        for(var i=0;i<keywords.length;i++){
            var re=new RegExp(keywords[i],"g");
            if(content.indexOf(keywords[i])!=-1){
                var result=content.replace(re,"***");
                content=result;
                $('#message').val(result);
                alert("您输入的内容中包含敏感字符，请重新输入！");
                return;
            };
        };

        //发送给服务器客户端，先构造消息结构
        var message={
            type:"201",//公共聊天内容
            content:content
        };
        clientSocket.send(message);

        //清空输入框
        $("#message").val('');
    });

    //回车发送消息
    $('#message').on('keyup', function (e) {
        if(e.keyCode==13){$('#send').click();}
    });

    //选择头像
    $('#imgBtn').on("click", function () {
        $("#pic").animate({'top':'0px'},1000,'easeInOutBounce')
    });
    $("#pic li img").on("mouseover", function () {
        $(this).css("opacity",0.5);
        $(this).parent("li").css("border","1px solid red");
    });
    $("#pic li img").on("mouseout", function () {
        $(this).css("opacity",1);
        $(this).parent("li").css("border","1px solid #fff");
    });
    $("#pic li img").on("click", function () {
        $(this).parent("li").addClass("ac").siblings().removeClass("ac");
        $(this).parent("li").find("span").append('<img src="images/ok.png"/>').siblings().find("span").html("");
    });
    $(".ok").on("click", function () {
        var path=$("#pic li.ac>img").attr("src");
        $(".chosedimg img").attr("src",path);
        $("#pic").animate({'top':'-384px'},1000,'linear');
    });
    $(".cancel").on("click", function () {
        $("#pic").animate({'top':'-384px'},1000,'linear');
    });

    //私聊
    $("#others").on('click','.members', function () {
        var enter="<div class='loginMsg'>[系统消息] 您正在与"+$(this).find('.membername').html()+"!</div>";
        $("#messages").append(enter);
    });
});
