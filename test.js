var hello = 'hello <%=username%>.<%-"<script>alert(xu)</script>"%>';
var luoji = '<%if (obj.user){%>\n'+'<h2><%=user.name%></h2>\n'+'<%}else{%>\n'+'<h2>匿名用户</h2>\n'+'<%}%>\n';
var html='<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '</head>' +
    '<body>' +
    '</body><div id=\'xu\'>xuhuiyuan</div>' +
    '</body>';    //需要这样解决html中有单引号的问题

var user={
    name:'mengying'
}
var data = {
    user:user,
    username:"xuhuiyuan"
}

console.log(renderXuV5(compileXuV5(html),{}));
/**
 * 第一版
 * @param str
 * @param data
 * @returns {Function}
 */
function renderXuV1(str,data){
    var tpl = str.replace(/<%=(.+?)%>/g,function(match,code){//.和[\s\S]有什么区别？
        return "'+obj."+code+"+'";
    });
    var tpl = "var tpl = '"+tpl+"';\nreturn tpl;";
    var complie = new Function('obj',tpl);
    console.log(complie.toString());
    return complie(data);
}

/**
 * 第二版，把compile和render分开，模板编译单独进行，一次编译多次执行
 * @param str
 * @returns {Function}
 */
function compileXuV2(str){
    var tpl = str.replace(/<%=([\s\S]+?)%>/g,function(match,$1){
        return "'+obj."+$1+"+'";
    });
    tpl = "var tpl = '"+tpl+"';\nreturn tpl;";
    return new Function('obj,escape',tpl);
}
function renderXuV2(compiled,data){
    return compiled(data);
}
/**
 * 第三版，应用with，实现常量，变量动态识别
 */
function compileXuV3(str){
    var tpl =str.replace(/<%=([\s\S]+?)%>/g,function(match,$1){
        return "'+"+$1+"+'";
    })
    tpl = "tpl = '"+tpl+"'";
    tpl = "var tpl = ''\nwith(obj){"+tpl+"}\nreturn tpl;";
    return new Function('obj,escape',tpl);
}
function renderXuV3(compiled,data){
    return compiled(data);
}
/*
*第四版加入xss安全防护，即使用escape进行转移。
 */
function escape(html){
    return String(html).replace(/&(?!\w+;)/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gl;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39');//ie下不支持&apos;（单引号）转义
}
function compileXuV4(str){
    var tpl =str.replace(/<%=([\s\S]+?)%>/g,function(match,$1){
        return "'+escape("+$1+")+'";
    }).replace(/<%-([\s\S]+?)%>/g,function(match,$1){
            return "'+"+$1+"+'";
        });
    tpl = "tpl = '"+tpl+"'";
    tpl = "var tpl = ''\nwith(obj){"+tpl+"}\nreturn tpl;";
    return new Function('obj,escape',tpl);
}
function renderXuV4(compiled,data){
    return compiled(data,escape);
}
/**
 * 第五版，加入逻辑判断，if else for 循环等
 */
function compileXuV5(str){
    var tpl =str.replace(/'/g,'\\\'')
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
function renderXuV5(compiled,data){
    return compiled(data,escape);
}
/**
 * 第六版，
 */
