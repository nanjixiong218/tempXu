var http = require("http");
var url = require('url');
var fs = require("fs");
var path = require("path");
var files = {};//文件缓存
var cache = {};//缓存，可以替换成高级点的缓存模块
var VIEWS_FOLDER = './views/';//使用绝对路径还是不行

//设置action方法
var exports = {};//action
exports.userAction = function(req,res){
    //var html = render("/routeTemplate/views/事件委托以及dblclick与click.html");
    res.render("test.html",data);//

};
exports.addUser=function(req,res){
    res.render("test.html",add);
}
//配置路由映射
exports.updateUser=function(req,res){
    res.render("test.html",update);
}
//配置路由映射
exports.deleteUser=function(req,res){
    res.render("test.html",deleted);
}
//配置路由映射
exports.getUser=function(req,res){
    res.render("test.html",get);
}
//配置路由映射
var routes={
    all:[]
};//路由
var app={};
/**
 * RESTful分配
 */
['get','post','delete','put'].forEach(function(method){
    routes[method] = [];
    app[method] = function(path,action){
        routes[method].push([pathRegexp(path),action]);
    }
});
app.use = use;
app.use('/user/:username',exports.userAction);

app.get('/user/:username',exports.getUser);
app.post('/user/:username',exports.addUser);
app.delete('/user/:username',exports.deleteUser);
app.put('/user/:username',exports.updateUser);
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
http.createServer(function(req,res){
    res.render = renderXuV6;
    //路由匹配，分发处理
    route();
    //处理不了才会执行到这，用try catch更合理一点
    handle404(req,res);
    /**
     * 第一个完整版渲染引擎,把它放在了createServer里面形成了一个闭包，这样才能访问到res，是不是不太好，最好是用中间件形式
     * @param viewname
     * @param data
     */
    function renderXuV6(viewname,data){
        var layout = data.layout;
        if(layout){
            if(!cache[layoout]){
                try{
                    cache[layout]=fs.readFileSync(path.join(VIEWS_FOLDER,layout),'utf-8');
                }
                catch(e){
                    res.writeHead(500,{'Content-Type':'text/html'});
                    res.end('layout file failed download ！');
                    return;
                }
            }
        }
        var layoutContent = cache[layout]||'<%-body%>';//如果没有指定布局文件，那么布局文件直接就是这个字符串
        var text =''
        try{
            text = renderlayoutXu(layoutContent,viewname);
        }catch(e){
            res.writeHead(500,{'Content-Type':'text/html'});
            res.end('template file failed download!');//如何解决中文乱码问题
            return;
        }
        var key = viewname+':'+layout;
        cache[key]=compileXuV6(text);

        var compiled = cache[key];
        res.writeHead(200,{'Content-Type':'text/html'});
        var html = compiled(data,escape);
        res.end(html);
    }

    /**
     * 路由匹配处理方法
     * @param pathname
     * @param routes
     */
    function match(pathname,routes){
        for(var i = 0;i<routes.length;i++){
            var route = routes[i];
            var keys =route[0].keys;
            var reg = route[0].regexp;
            var matched = reg.exec(pathname);
            if(matched){
                var params ={};
                for(var i=0;i<keys.length;i++){
                    var value = matched[i+1];
                    if(value){
                        params[keys[i]]=value;
                    }
                }
                req.params = params;
                var action = route[1];
                action(req,res);
                return true;
            }
        }
        return false;
    };
    /**
     * 路由分发部分
     */
    function route(){
        var pathname = url.parse(req.url).pathname;
        var method = req.method.toLowerCase();
        //根据请求方法类型进行分发
        if(routes.hasOwnProperty(method)){
            if(match(pathname,routes[method])){
                return;
            }else{
                //get中没有设置对应的匹配，尝试用all中的匹配进行处理
                if(match(pathname,routes.all)){
                    return;
                }
            }
        }else{//没有设置method方法用all处理
            if(match(pathname,routes.all)){
                return;
            }
        }
    }


}).listen(1337,'127.0.0.1');


/**
 *处理404错误
 *
**/
function handle404(req,res){
    res.writeHead(200,{'Content-Type':'text/plain'});
    res.end('404Wrong!');
}
/**
 *路由解析的正则匹配
**/
function pathRegexp(path){
    var keys = [];
   // path = path.concat(strict?'':'/?');
    path = path.replace(/\/\(/g,'(?:/');
    path = path.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g,function(_,slash,format,key,capture,optional,star){
        keys.push(key);
        slash=slash||'';
        return ''
        +(optional ?'':slash)
        +'(?:'
        +(optional ?slash:'')
        +(format||'')
        +(capture || (format&&'([^/.]+?)'||'([^/]+?)'))+')'
        +(optional ||'')
        +(star?'(/*)?':'')
    });
    path = path.replace(/([\/.])/g,'\\$1');
    path = path.replace(/\*/g,'(.*)');
    return {
        keys:keys,
        regexp:new RegExp('^'+path+'$')
    };
}

/**
 * 设置路由映射的方法
 * @param path
 * @param action
 */
function use(path,action){
    routes.all.push([pathRegexp(path),action]);
}

/**
 * 最简单的渲染
 * @param filePath
 * @returns {*}
 */
function render(filePath){
    return fs.readFileSync(filePath);//这里无法使用异步读取，因为render方法是同步的。
}

/**
 *布局视图功能
 * @param str 布局视图文件
 * @param viewname 模板文件
 * @returns {XML|string|void}最终模板字符串
 */
function renderlayoutXu (str,viewname){
    return result = str.replace(/<%-\s*body\s*%>/g,function(match){
        if(!cache[viewname]){
            cache[viewname] = fs.readFileSync(path.join(VIEWS_FOLDER,viewname),'utf-8');
        }
        return cache[viewname];
    });
}
/**
 * 预编译
 * 将模板字符串中的include标签替换为子模板
 * @param str 模板字符串
 */

function preCompile(str){
    var replaced = str.replace(/<%\s+(include\s+.*)\s+%>/g,function(match,$1){
        var partial = $1.split(/\s/)[1];
        if(!files[partial]){
            files[partial]=fs.readFileSync(path.join(VIEWS_FOLDER,partial),'utf-8');
        }
        return files[partial];
    });
    //多层嵌套
    if(str.match(/<%\s+(include *)\s+%>/g)){
        return preCompile(replaced);
    }else{
        return replaced;
    }
}
/**
 * 模板编译函数：最重要的函数，将模板字符串中的特殊标签进行替换并生成中间函数
 * 中间函数：一个能够接收数据并生成最终html文本的函数
 * @param str 模板字符串
 * @returns {Function}
 */
function compileXuV6(str){
    str = preCompile(str);
    var tpl =str.replace(/[\n\r]/g,'\\n')//替换所有换行符
        .replace(/'/g,'\\\'')             // 替换单引号
        .replace(/<%=([\s\S]+?)%>/g,function(match,$1){
        return "'+escape("+$1+")+'";
    }).replace(/<%-([\s\S]+?)%>/g,function(match,$1){
            return "'+"+$1+"+'";
        }).replace(/<%([\s\S]+?)%>/g,function(match,$1){
            return "';\n"+$1+"\ntpl+='";
        });
    tpl = tpl.replace(/\'\n/g,'\'');    //??正则里单引号也不需要转义啊
    tpl = tpl.replace(/\n\'/gm,'\'');   //??
    tpl = "tpl = '"+tpl+"';";
    tpl= tpl.replace(/''/g,'\'\\n\'');  //转换空行？
    tpl = "var tpl = '';\nwith(obj||{}){\n"+tpl+"\n}\nreturn tpl;";
    return new Function('obj,escape',tpl);
}



