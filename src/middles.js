/**
 * Created by Administrator on 14-6-3.
 */
module.exports={
    querystring :function (req, res, next) {
    req.querystring = url.parse(req.url,true).query;
    next();
    },
    cookie:function cookie(req, res, next) {
        var cookie = req.headers.cookie;
        var cookies = {};
        if (cookie) {
            var list = cookie.split(";");
            for (var i = 0; i < list.length; i++) {
                var pair = list[i].split("=");
                cookies[pair[0].trim()] = pair[1];
            }
        }
        req.cookie = cookies;
        next();
    }
}

