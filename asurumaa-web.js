
var WEBSITE_LIVE = true;

/**
 * Module dependencies.
 */

var express = require('express')
  , request = require('request')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , MongoStore = require('connect-mongo')(express)
  , async = require('async')
  , jade_browser = require('jade-browser')
  , moment = require('moment')
_.str = require('underscore.string');

var arg = require('optimist').argv;
var twitter = require('ntwitter');




var cms = require('./lib/cms');
cms.add('website_administration',{
	single:true,
	fields:{
		contact:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:true,   
			crop_width:455,
			crop_height:415
		},		
		mobile:{type:'string'},
		phone:{type:'string'},
		fax:{type:'string'},
		twitter:{type:'string'},
		facebook:{type:'string'},
		google_analytics:{type:'string', multi:true}
	}
});
cms.add('website_about',{
	fields:{
		name:{type:"string"},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:1170, 
			crop_height:550, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_news',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true},
		article:{type:'string', multi:true, rtl:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			crop_width:680, 
			crop_height:400, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]
		}		
	}
});

cms.add('website_gallery',{
	fields:{
		name:{type:"string"},
		description:{type:'string', multi:true},
		image:{
			type:'image', 
			maintain_ratio:false,   
			manualcrop:false,
			crop_width:900, 
			crop_height:584/*, 
			sizes:[
				{
					prefix:"medium", 
					width:240, 
					height:180,
				}, 
				{
					prefix:"mediumbig", 
					width:370, 
					height:370
				}
			]*/
		}		
	}
});


cms.add('list_parties',{
	searchable:true,
	fields:{
		name:{type:'string'},
	}
});
cms.add('list_type',{
	searchable:true,
	fields:{
		name:{type:'string'},
	}
});
cms.add('list_ppl',{
	fields:{
		name:{type:"string"},
		party:{type:'select', source:'list_parties.name'},
		type:{type:'select', source:'list_type.name'},
		designation:{type:'string'},
		constituency:{type:'string'},
		twitter:{type:'string'},
		fb:{type:'string'},
		description:{type:'string', multi:'true'},
		images:{
			type:'image', 
			maintain_ratio:true,   
			manualcrop:true,
			crop_width:100, 
			crop_height:100,
			sizes:[
				{
					prefix:"medium", 
					width:100, 
					height:100,
				}
			]

		}		
	}
});

cms.run(function(){
	//setup pre requisites
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3067);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon(__dirname + '/public/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.compress());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.cookieParser("herro"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.session({secret:"herro",store: new MongoStore({url:'mongodb://127.0.0.1:27017/poolchemicals'}), cookie: { maxAge: 600000000 ,httpOnly: false, secure: false}}));
app.use(express.methodOverride());
app.use(jade_browser('/modals/packages.js', 'package*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/modals/products.js', 'product*', {root: __dirname + '/views/modals', cache:false}));	
app.use(jade_browser('/templates.js', '**', {root: __dirname + '/views/components', cache:false}));	
app.use(function(req, res, next){
  	res.header('Vary', 'Accept');
	next();
});	
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

cms.listen(app);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res){
	if(WEBSITE_LIVE == false){
		res.render('comingsoon');
	}else{
		async.auto({
			administration:function(fn){
				cms
				.website_administration
				.findOne()
				.lean()
				.exec(fn);	
			},
			news:function(fn){
				cms
				.website_news
				.find()
				.sort({_id:-1})
				.limit(4)
				.lean()
				.exec(function(err, articles){
					if(err) return fn(err);
					articles = _.map(articles, function(article){
						//TODO: t
						//extract time from objectid
						
						return article;
					});
					fn(null,articles);
				});	
			},
			gallery:function(fn){
				cms
				.website_gallery
				.find()
				.sort({_id:-1})
				.lean()
				.exec(fn);	
			},
			top_news:function(fn){
				cms.website_news
				.findOne()
				.sort({views:-1})
				.lean()
				.exec(fn)
			}
		},function(err, page){
			page.pics = PICS;
			page.people = PPL;
			page.news = NEWS;
			res.render('index',page);
		});
	}
});
app.get('/launch', function(req, res){
	res.render('launch');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
//#e23636
var PICS = [];
var PPL = [];
var NEWS = [];
async.forever(function(next){
	async.waterfall([
		function getAllPeople(fn){
			cms.list_ppl
			.find({})
			.lean()
			.exec(fn)
		},
		function lookupUsers(people, fn){
			var twit = new twitter({
				consumer_key: arg.ck,
				consumer_secret: arg.cs,
				access_token_key: arg.atk,
				access_token_secret: arg.ats
			});
			var ppl = people.map(function(p){return p.twitter;}).join(',');
			var rest = people.filter(function(p){return p.twitter == '' || !p.twitter;})
			twit.lookupUser(ppl, function(err, list){
				var list = _.map(list, function(p){
					var name = p.screen_name.toLowerCase();
					var f = _.find(people, function(f){return f.twitter.toLowerCase() == name;});
					return _.extend(p, f);
				});
				list = rest.concat(list)
				console.log(list, 4);
				fn(null, list);
			});			
		},
	], function(err, ppl){
		if(err){
			console.log(err);
		}
		PPL = ppl;
		setTimeout(function(){
			next();
		}, 1000 * 60 * 3);
	});
}, function(err){

});
async.forever(function(next){
	async.waterfall([
		function getData(fn){
			request('https://graph.facebook.com/v2.1/263037627237512/posts?fields=likes.limit(1).summary(true),message,object_id,shares,picture&access_token=312876022197325|gDpu22u-NcP2jLEdDxEp61OteFA&limit=50', fn);
		},
		function parseData(raw,body,fn){
			try{
				var data = JSON.parse(body);
				if(data.error){
					return fn(data.error);
				}
				var posts = data.data;
				fn(null, posts);
			}catch(e){
				if(e){
					fn(e);
				}
			}
		},
		function filterPosts(posts, fn){
			var c = _.reduce(posts, function(count, p){
				if(!p.likes){
					return count;
				} 
				return count + p.likes.summary.total_count;
			}, 0);
			var filtered = _.filter(posts, function(post){
				if(!post || !post.message){
					return false;
				}
				return post.message.indexOf('#amv') != -1;
			});
			fn(null, filtered)
		},
		function getPictures(posts, fn){
			async.map(posts, function(post, done){
				var url = 'https://graph.facebook.com/v2.1/'+post.object_id+'?&access_token=312876022197325|gDpu22u-NcP2jLEdDxEp61OteFA';
				request(url, function(err, raw, body){
					var body = JSON.parse(body);
					done(null, body);
				});
			},fn)
		},
		function getLargestImages(posts, fn){
			var posts = posts.map(function(post){
				return _.max(post.images, function(img){
					return img.height;
				});
			});
			fn(null, posts);
		}
	], function(err, pics){
		if(err){
			console.log(err);
		}
		PICS = pics;
		setTimeout(function(){
			next();
		}, 1000 * 60 * 3);
	});
},function(err){});

async.forever(function(next){
	async.waterfall([
		function getData(fn){
			request('https://graph.facebook.com/v2.1/ninmaifin/posts?fields=link,likes.limit(1).summary(true),message,object_id,shares,picture&access_token=312876022197325|gDpu22u-NcP2jLEdDxEp61OteFA&limit=50', fn);
		},
		function parseData(raw,body,fn){
			try{
				var data = JSON.parse(body);
				if(data.error){
					return fn(data.error);
				}
				var posts = data.data;
				fn(null, posts);
			}catch(e){
				if(e){
					fn(e);
				}
			}
		},
		function filterPosts(posts, fn){
			var c = _.reduce(posts, function(count, p){
				if(!p.likes){
					return count;
				} 
				return count + p.likes.summary.total_count;
			}, 0);
			var filtered = _.filter(posts, function(post){
				if(!post || !post.message){
					return false;
				}
				return post.message.indexOf('#amv') != -1;
			});
			filtered = filtered.map(function(f){
				f.message = f.message.split("\n").shift();
				return f;
			})
			fn(null, filtered)
		}
	], function(err, news){
		if(err){
			console.log(err);
		}
		NEWS = news;
		setTimeout(function(){
			next();
		}, 1000 * 60 * 3);
	});
},function(err){});