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
		});

		rawRes.on('close', function () {
		});
		//the whole response has been recieved, so we just print it out here
		rawRes.on('end', function () {
			var hulkChunk = hulkify(totalHTML, function(hulked){
				res.write(hulked);
	    		res.end();
			});
		});
	}

	http.get(options, callback).end();
}

var hulkify = function(html, callback){

	var outHtml = html;
      outHtml = outHtml.replace("&copy; 2016 &bull; All Rights Reserved &bull; Tampa Bay Times", '');
      outHtml = outHtml.replace("490 First Avenue South &bull; St. Petersburg, FL 33701 &bull; 727-893-8111", '');
      outHtml = outHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      outHtml = outHtml.replace(/<iframe \b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '<div class="filler-hulk"></div>');

      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/politifact%2Frulings%2Frulings-tom-true.gif/gi, '/images/True.png');
      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/rulings%2Ftom-mostlytrue.gif/gi, '/images/mostlyTrue.jpg');
      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/rulings%2Ftom-halftrue.gif/gi, '/images/mostlyTrue.jpg');
      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/rulings%2Ftom-mostlyfalse.gif/gi, '/images/mostlyFalse.gif');
      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/rulings%2Ftom-false.gif/gi, '/images/False.jpg');
      outHtml = outHtml.replace(/http:\/\/static.politifact.com.s3.amazonaws.com:80\/rulings%2Ftom-pantsonfire.gif/gi, '/images/Hulkroars.gif');



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

  var reg = new RegExp("(<.*?>[^<]*?)politifact([^<]*?<.*?>)", "gim");
  outHtml = outHtml.replace(reg, "$1PolitiSMASH!!$2");


  var reg = new RegExp("\>Truth-O-Meter|truthometer", "gim");
  outHtml = outHtml.replace(reg, ">Hulk-O-Meter");
  var reg = new RegExp("Pants on Fire", "gim");
  outHtml = outHtml.replace(reg, "HULK ANGRY!");
	var images = [];

	var tmp;
	images = outHtml.match(/<img.+?src=\"(.*?)\".*?>/g);
	// console.log("====================================================")
	// console.log(images)
	// console.log("====================================================")
	var length = 0;

	if(images == null) return callback("");
	else length = images.length;

	for(var i = 0 ; i < length; i++){
		images[i] = images[i].match(/https*:\/\/.*?\.(jpg|png)/gi)
		if(images[i] && images[i][0] ){
		  var filename = images[i][0].replace(/https*:\/\/.*\//, "");
		  filename = filename.replace(/%[A-Z0-9]{2}/gi, "");
		  var url = images[i][0];
		  download(url, filename, function(data){
			outHtml = outHtml.replace(data.url, "/images/hulks/"+data.filename+'_hulked.png' )
		  });
		}
	}

	opencalais.request( outHtml.substring(0, (1024*100/4)), {"outputFormat":'application/json', "contentType":"text/raw"}, function(err,res) {
  	var people = {};
  	Object.keys(res).forEach(function(key) {
  	  if(!(key.match(/pershash/i) == null) && res[key].firstname){
  	  	people[res[key].name] = res[key];
  	  	var fn = res[key].firstname;
  	  	var reg = new RegExp("(<.*?>[^<]*?)"+fn+"([^<]*?<.*?>)", "gim");
	  	  outHtml = outHtml.replace(reg, "$1<span style='color:green' >Hulk</span>$2");
  	  }
		});
    callback(outHtml);
	  fs.writeFile("./ocOut", JSON.stringify(res, null, 4), function(err) { console.log(err)} );
	});
	return;
}

//credit: http://stackoverflow.com/questions/12740659/downloading-images-with-node-js
var download = function(uri, filename, callback){
  if (!fs.existsSync(imagesfolder + filename) ){
  	request.head(uri, function(err, res, body){
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
  // g1(filepath, function(){
  	g2(filepath, function(){
  		overlay1(filepath, callback);
    //   function(){
  		// 	// overlay2(filepath, callback);
  		// });
  	})
  // })
  function g1(filepath, callback){
	  gm(filepath)
	  // .command("convert")
	  // // .out("+matte")
	  // // .out("-matte")
	  // .out("-fuzz")
	  // .out("20%")
	  // .out("-fill")
	  // .out("#000000")
	  // .out("-transparent")
	  // .out("#F3CEBE")
	  // .out("-operator")
	  // .out("matte")
	  // .out("negate")
	  // .out("1")
	  // .out("-fuzz")
	  // .out("20%")
	  // .out("-fill")
	  // .out("#333")
	  // .out("-opaque")
	  // .out("#F3CEBE")
   //  .out("-flatten")
	  // .blur(35)
	  // .colorize(80, 0, 30)
	  .write(filepath+"high.png", callback);
  }
  function g2(filepath, callback){
	  gm(filepath)
	  .command("convert")
	  .out("-fuzz")
	  .out("50%")
	  .out("-fill")
	  .out("#000")
	  .out("-transparent")
	  .out("#ba846b")
	  .out("-operator")
	  .out("matte")
	  .out("negate")
	  .out("1")
	  .out("-fuzz")
	  .out("50%")
	  .out("-fill")
	  .out("#000")
	  .out("-opaque")
	  .out("#ba846b")
    .out("-flatten")
	  .blur(20)
	  // .colorize(80, 0, 30)
	  .write(filepath+"shadow.png", callback);
  }
  function overlay1(filepath, callback){
	gm(filepath)
    .mask(filepath+"shadow.png")
    // .colorize(80, 0, 30)
    .modulate(50, 180, 130)
    .out("+mask")
    // .composite(filepath+"shadow.png")
	  // .compose("Multiply")
  	.write(filepath+'_hulked.png', callback);
  }
  function overlay2(filepath, callback){
  	gm(filepath)
    // .mask(filepath+"high.png")
    // // .colorize(80, 0, 30)
    // .modulate(90, 100, 115)
    // .out("+mask")
   //  	// .composite(filepath+"high.png")
  	// // .compose("Lighten")
   //  .composite(filepath+"high.png")
  	// .compose("Multiply")
    .write(filepath, callback);
  }
}