var express = require('express');
var crypto = require('crypto');
var forge = require('node-forge');
var bson = require('bson');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
    mongoose.connect('UN');

var item = mongoose.Schema({
    ip: String,
    created: { type: Date, default: Date.now },
    hmac: String,
    tag: String,
    decrypted: { type: Boolean, default: false },
    uri: String,
    iv: String,
    message: String
});

var Crypts = mongoose.model('crypt', item);


var app = express();

app.engine('html', require('ejs').renderFile);
app.enable('trust proxy');
app.set('views', __dirname + '/app');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/app'));
app.use(express.static(__dirname, 'public'));
app.use(bodyParser());


app.get('/', function(req, res){
    res.render('app/index.html');
});


app.use(function (req, res, next) {
  if ('/robots.txt' == req.url) {
      res.type('text/plain')
      res.send("User-agent: *\nDisallow: /");
  } else {
      next();
  }
});

app.post('/crypts', function(req, res){

    console.log(req);

    console.log(req.connection.remoteAddress);
    console.log(req.body);

    var newCrypt = {
        ip: req.connection.remoteAddress,
        hmac: req.body.hmac,
        iv: req.body.iv,
        decrypted: false,
        tag: req.body.tag,
        message: req.body.message,
        uri: req.body.uri
    };

    var crypt = new Crypts(newCrypt);

    crypt.save(function (err) {
        if (err) { console.log(err);

        } else {

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.send(newCrypt);

        }

    });


});

app.get('/crypts', function(req, res){
    Crypts.find({}, function(err, crypts){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.send(crypts);
    });
});

app.post('/crypts/:uri', function(req, res){

    console.log(req.params.uri);

    var uri = req.params.uri,
        key = req.body.key;

    console.log('URI: '+uri);
    console.log('Key: '+key);

    Crypts.findOne({ uri: uri }, function(err, crypt){

        if(err){ console.log(err); }

        if(crypt){

            var convertFromHex = forge.util.hexToBytes(key);
            var derivedKey = forge.util.createBuffer(convertFromHex, 'raw');

            var hmac = forge.hmac.create();
            hmac.start('sha256',  derivedKey);
            hmac.update(uri);

            var h = hmac.digest().toHex();

            console.log('New HMAC '+h);
            console.log('Old HMAC '+crypt.hmac);

            if(h == crypt.hmac){

                var convertFromHex = forge.util.hexToBytes(uri);
                var buffer = forge.util.createBuffer(convertFromHex, 'raw');

                var newIV = forge.util.hexToBytes(crypt.iv);

                var cipher = forge.aes.createDecryptionCipher(derivedKey, 'CBC');

                cipher.start(newIV);
                cipher.update(buffer);
                cipher.finish();
                // outputs decrypted hex
                var decrypt = cipher.output.data;

                crypt.message = decrypt;

                Crypts.update({ uri: uri}, { message: decrypt, decrypted: true }, function(err, doc){
                    console.log(doc);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "X-Requested-With");
                    res.send(crypt);
                });

            } else {

                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "X-Requested-With");
                res.send('No whispers for you.');

            }


        } else {

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.send('No whispers for you.');
        }

    });

});

app.get('/comments/:uri', function(req, res){
    Crypts.findOne({ uri: req.params.uri }, function(err, doc){
        if(doc){
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.render('crypt.html', {
                uri: doc.uri
            });
        } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.send('No whispers for you!');
        }

    });
});


app.get('/:uri', function(req, res){
    Crypts.findOne({ uri: req.params.uri }, function(err, doc){
        if(doc){
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.send(doc);
        } else {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.send('No whispers for you!');
        }
    });
});
app.listen(80);
