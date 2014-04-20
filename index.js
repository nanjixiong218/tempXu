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
        var handle;
        if(typeof path =="string"){//如果第一个参数是字符串说明是路径，后面的是中间件
            handle = {
                path:pathRegexp(path),
                stack:Array.prototype.slice.call(arguments,1)
            };
        }else{//如果第一个参数不是字符串，那就全当中间件处理,并且把path设为访问根路径
            handle = {
                path:pathRegexp("/"),
                stack:Array.prototype.slice.call(arguments,0)
            };
        }
        routes[method].push(handle);
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
        var stacks = [];
        for(var i = 0;i<routes.length;i++){
            var route = routes[i];
            var keys =route.path.keys;
            var reg = route.path.regexp;
            var matched = reg.exec(pathname);
            if(matched){
                var params ={};
                for(var i=0;i<keys.length;i++){
                    var value = matched[i+1];
                    if(value){
                        params[keys[i]]=value;
                    }
                };
                //将中间件交给handle方法处理
                req.params = params;
                stacks = stacks.concat(route.stack);
            }
        }
        return stacks;
    };
    /**
     * 路由分发部分
     */
    function route(){
        var pathname = url.parse(req.url).pathname;
        var method = req.method.toLowerCase();
        var stacks = match(pathname,routes.all);//这样的话，如果在use中设置了action，get，post等中设置的action将不会执行到
        if(routes.hasOwnProperty(method)){//写了中间件这个位置代码简化很多
            stacks = stacks.concat(match(pathname,routes[method]));
        };
        if(stacks.length){
            handleMiddle(req,res,stacks);
        }else{
            handle404(req,res);
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
function use(path){
    var handle;
    if(typeof path =="string"){//如果第一个参数是字符串说明是路径，后面的是中间件
        handle = {
            path:pathRegexp(path),
            stack:Array.prototype.slice.call(arguments,1)
        };
    }else{//如果第一个参数不是字符串，那就全当中间件处理,并且把path设为访问根路径
        handle = {
            path:pathRegexp("/"),
            stack:Array.prototype.slice.call(arguments,0)
        };
    }
    routes.all.push(handle);
};

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
/**
 * 中间件
 */
function querystring (req,res,next){
    req.querystring  = url.parse(req.url).querystring;
    next();
}
function cookie(){
    var cookie = req.headers.cookie;
    var cookies = {};
    if(cookie){
        var list = cookie.split(";");
        for(var i=0;i<list.length;i++){
            var pair = list[i].split("=");
            cookies[pair[0].trim()]=pari[1];
        }
    }
    req.cookie = cookies;
    next();
};
/**
 * 用于处理中间件的方法,这个方法很不错
 */
function handleMiddle(req,res,stack){
    var next =function(){
        var middleWare = stack.shift();
        if(middleWare){
            //传入next使其能够递归调用，这也是编写中间件是必须写next参数，并在最后调用next（）的原因。
            middleWare(req,res,next);
        }
    };
    next();
}

