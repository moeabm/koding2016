/**
 * GET /
 * Home page.
 */

var http = require('http')
var request = require('request')
var zlib = require('zlib');
var secrets = require("../config/secrets");
var opencalais = require('../lib/opencalais')(secrets.opencalaisKey);
var when = require('when');
var fs = require('fs');
var gm = require('gm');
var imagesfolder = __dirname+"/../public/images/hulks/";

exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.all = function (req, res){
	// console.log("calling politifact");
	// res.render('home', {
	// 	title: 'Home'
	// });
	// The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
	var site = "www.politifact.com"
	var options = {
		protocol: "http:",
		host: site,
		path: req.path,
		headers: {
			"Host": site,
			"Connection": "keep-alive",
			"Cache-Control": "max-age=0",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Upgrade-Insecure-Requests": "1",
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36",
			"Accept-Encoding": "gzip, deflate, sdch",
			"Accept-Language": "en-US,en;q=0.8",
		}
	};

	callback = function(response) {
		var totalHTML = '';
		// var chunks = [];
		// var i = 0;
		// var hulkingQue = [];
		// var promises = [];
	    res.writeHead(response.statusCode);
	    console.log(response.headers['content-encoding']);
	    console.log(response.headers['content-length']);
	    var encoding = response.headers['content-encoding']
	    var rawRes; 

	    if (encoding == 'gzip') {
	      rawRes = response.pipe(zlib.createGunzip())
	    } else if (encoding == 'deflate') {
	      rawRes = response.pipe(zlib.createInflate())
	    } else {
	      rawRes = response
	    }

		// set encoding
		rawRes.setEncoding('utf8');

		//another chunk of data has been recieved, so append it to `str`
		rawRes.on('data', function (chunk) {
			totalHTML += chunk;
			// console.log(hulkChunk );
			// var chunkIndex = i++;
			// hulkingQue[chunkIndex] = when.defer();
			// promises.push(hulkingQue[chunkIndex].promise);
			// var hulkChunk = hulkify(chunk, function(hulked){
			// 	chunks[chunkIndex] = hulked;
			// 	hulkingQue[chunkIndex].resolve;
			// 	console.log("hulkingQue["+chunkIndex+"].resolve");
			// 	// res.write(hulked);
			// });
		});
		rawRes.on('close', function () {
	    	// closed, let's end client request as well 
	    	// res.writeHead(response.statusCode);
	  //   	when.all(promises).then(function () {
	  //   		console.log("MADE IT");
	  //   		console.log(join(chunks));
	  //   		res.write(join(chunks));
	  //   		res.end();
			// });
	    	// res.end();
		});
		//the whole response has been recieved, so we just print it out here
		rawRes.on('end', function () {
			// console.log(response.statusCode);
	    	// res.writeHead(response.statusCode);
			var hulkChunk = hulkify(totalHTML, function(hulked){
				res.write(hulked);
	    		res.end();
			});
	  //   		console.log("MADE IT");
	  //   	when.all(promises).then(function () {
	  //   		console.log("MADE IT");
	  //   		console.log(join(chunks));
	  //   		res.write(join(chunks));
	  //   		res.end();
			// });
		});
	}

	http.get(options, callback).end();
}

var hulkify = function(html, callback){

	var outHtml = html;
      outHtml = outHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  var addlheaders = '<link rel="stylesheet" type="text/css" href="/css/hulk.css">\n';
      addlheaders += '<link rel="stylesheet" href="/css/jquery-ui.min.css">';
      addlheaders += '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>\n';
      addlheaders += '<script src="/js/jquery-ui.min.js"></script>';
      addlheaders += '<script src="http://static.politifact.com/js/lib/modernizr.js"></script>\n';
      addlheaders += '<script src="http://static.politifact.com/js/navscript.js"></script>\n';
      addlheaders += '<script type="text/javascript" src="/js/hulk.js" ></script>\n';
  outHtml = outHtml.replace(/<\/head>/, addlheaders + '</head>');
  var addlBody = '<script src="http://static.politifact.com/js/lib/jquery.bxslider.min.js"></script>\n';
      addlBody += '<script src="http://static.politifact.com/js/pfact.js"></script>\n';
  outHtml = outHtml.replace(/<\/body>/i, addlBody + '</body>');

	var images = [];

	var tmp;
	images = outHtml.match(/<img.+?src=\"(.*?)\".*?>/g);
	console.log("====================================================")
	console.log(images)
	console.log("====================================================")
	var length = 0;

	if(images == null) return callback("");
	else length = images.length;

	for(var i = 0 ; i < length; i++){
		images[i] = images[i].match(/https*:\/\/.*?\.(jpg|png)/gi)
		if(images[i] && images[i][0] ){
		  console.log(images[i]);
  		  var filename = images[i][0].replace(/https*:\/\/.*\//, "");
  		  filename = filename.replace(/%[A-Z0-9]{2}/gi, "");
  		  var url = images[i][0];
		  download(url, filename, function(data){
			console.log("URL:" + data.url );
			outHtml = outHtml.replace(data.url, "/images/hulks/"+data.filename )
		  });
		}
	}

	// console.log(html);
	opencalais.request( outHtml.substring(0, (1024*100/4)), {"outputFormat":'application/json', "contentType":"text/raw"}, function(err,res) {
	  // console.log(JSON.stringify(res, null, 4));
	  	var people = {};
	  	Object.keys(res).forEach(function(key) {
	  		// console.log(key);
	  	  if(!(key.match(/pershash/i) == null) && res[key].firstname){
	  	  	people[res[key].name] = res[key];
	  	  	var fn = res[key].firstname;
	  	  	var reg = new RegExp("(<.*?>[^<]*?)"+fn+"([^<]*?<.*?>)", "gim");
		  	outHtml = outHtml.replace(reg, "$1<span style='color:green' >Hulk</span>$2");
	  	  	//console.log(JSON.stringify(res[key], null, 4));
	  	  	console.log("fn: " + res[key].firstname);
	  	  }
		});
	  	// console.log(JSON.stringify(people, null, 4));

  	  var reg = new RegExp("(<.*?>[^<]*?)politifact([^<]*?<.*?>)", "gim");
	  	outHtml = outHtml.replace(reg, "$1PolitiSMASH!!$2");

	  	
      callback(outHtml);
	  	fs.writeFile("./ocOut", JSON.stringify(res, null, 4), function(err) { console.log(err)} );
	});
	return;
}

// //assumes protocol presence and no parameters
// var download = function(imageURL){
// 	var filename = imageURL.replace(/http:\/\/.*\//, "");
// 	http.get({url: imageURL}, function(response){
// 		var wstream = fs.createWriteStream(filename);
// 		response.on("data", function(data){
// 			wstream.write(data);
// 		})
// 	}).end();
// }

//credit: http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
var download = function(uri, filename, callback){
  if (!fs.existsSync(imagesfolder + filename) ){
	console.log(uri);
	request.head(uri, function(err, res, body){
	  console.log('content-type:', res.headers['content-type']);
	  console.log('content-length:', res.headers['content-length']);
	  request(uri).pipe(fs.createWriteStream(imagesfolder + filename)).on('close', function(){
	  	greenify(imagesfolder + filename, function(){ 
	  	})
	  });
	});

  }

	  	  callback({url: uri, filename: filename});
};

//SMASH ANIMATION


function greenify(filepath, callback){
  g1(filepath, function(){
  	g2(filepath, function(){
  		overlay1(filepath, function(){
  			overlay2(filepath, callback);
  		});
  	})
  })
  function g1(filepath, callback){
	  gm(filepath)
	  .command("convert")
	  // .out("+matte")
	  // .out("-matte")
	  .out("-fuzz")
	  .out("35%")
	  .out("-fill")
	  .out("#FFFFFF")
	  .out("-transparent")
	  .out("#F3CEBE")
	  .out("-operator")
	  .out("matte")
	  .out("negate")
	  .out("1")
	  .out("-fuzz")
	  .out("35%")
	  .out("-fill")
	  .out("#DFE")
	  .out("-opaque")
	  .out("#F3CEBE")
	  .blur(15)
	  .colorize(80, 0, 30)
	  .write(filepath+"high.png", callback);
  }
  function g2(filepath, callback){
	  gm(filepath)
	  .command("convert")
	  .out("-fuzz")
	  .out("17%")
	  .out("-fill")
	  .out("#AAFFDD")
	  .out("-transparent")
	  .out("#AA7259")
	  .out("-operator")
	  .out("matte")
	  .out("negate")
	  .out("1")
	  .out("-fuzz")
	  .out("17%")
	  .out("-fill")
	  .out("#AAFFDD")
	  .out("-opaque")
	  .out("#AA7259")
	  .blur(5)
	  .colorize(80, 0, 30)
	  .write(filepath+"shadow.png", callback);
  }
  function overlay1(filepath, callback){
	gm(filepath)
	.compose("Multiply")
  	.composite(filepath+"high.png")
  	// .composite(filepath+"shadow.png")
  	.write(filepath, callback);
  }
  function overlay2(filepath, callback){
	gm(filepath)
  	// .composite(filepath+"high.png")
	// .compose("Lighten")
	.compose("Multiply")
  	.composite(filepath+"shadow.png")
  	.write(filepath, callback);
  }
}