var http = require("http");
var url = require('url');
var fs = require("fs");
var path = require("path");
var frameXu = require("./frameXu.js");
//设置action方法
var actions = {};//action
actions.userAction = function(req,res){
    //var html = render("/routeTemplate/views/事件委托以及dblclick与click.html");
    res.render("test.html",data);//
};
actions.addUser=function(req,res){
    res.render("test.html",add);
}
//配置路由映射
actions.updateUser=function(req,res){
    res.render("test.html",update);
}
//配置路由映射
actions.deleteUser=function(req,res){
    res.render("test.html",deleted);
}
//配置路由映射
actions.getUser=function(req,res){
    res.render("test.html",get);
};
actions.cookie =function(req,res){
    res.render("cookieTest.html",req);
}
frameXu.app.use('/cookie',frameXu.middles.cookie,frameXu.middles.querystring);
frameXu.app.get('/cookie',actions.cookie);
frameXu.app.get('/user/:username',actions.getUser);
frameXu.app.post('/user/:username',actions.addUser);
frameXu.app.delete('/user/:username',actions.deleteUser);
frameXu.app.put('/user/:username',actions.updateUser);
//测试数据
var users=[
    {
    name:"xu",age:"23"
    },
    {
    name:"meng",age:"25"
    }
];
var data = {
    users:users,
    layout:''
};
var add = {
    users:[{name:'add'}]
};

var deleted= {
    users:[{name:'delete'}]
};
var update = {
    users:[{name:'update'}]
};
var get = {
    users:[{name:'get'}]
};

//创建服务器
http.createServer(frameXu.createServerFunction()).listen(1337,'127.0.0.1');


