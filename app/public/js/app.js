require(['forge'], function(forge){

App = Ember.Application.create({

});

    App.AuthorView = Ember.View.extend({
        // We are setting templateName manually here to the default value
        templateName: "author",

        // A fullName property should probably go on App.Author,
        // but we're doing it here for the example
        fullName: (function() {
            return this.get("author").get("firstName") + " " + this.get("author").get("lastName");
        }).property("firstName","lastName")
    })

App.Router.map(function() {
    // put your routes here
});


    Ember.Handlebars.helper('truncate', function(value, options) {

        var truncatedString = value.substring(0, 60);

        var escaped = Handlebars.Utils.escapeExpression(truncatedString);
        return new Handlebars.SafeString(escaped);
    });


    Ember.Handlebars.helper('urls', function(value, options) {

        var httpCheck = value.indexOf('http');

        var parsed_http = [];
        if(httpCheck > 0){
            var tmp = value.split(' ');
            tmp.forEach(function(obj){
                console.log(obj);
                if(obj.indexOf('http') > -1) {
                    var val = obj.replace(/[`~!@$^&*()_|;',<>\{\}\[\]]/gi, '');
                    console.log(val);
                    parsed_http.push('<a target="_blank" href="'+val+'">'+val+'</a>')
                } else {
                    parsed_http.push(obj);
                }
            });
        } else if (httpCheck > -1 ) {
            var val = value.replace(/[`~!@$^&*()_|;',<>\{\}\[\]]/gi, '');
            console.log(val);
            parsed_http.push('<a target="_blank" href="'+val+'">'+val+'</a>');
        } else {
            parsed_http.push(value);
        }

        var escaped = Handlebars.Utils.escapeExpression(value);
        return new Handlebars.SafeString(parsed_http.join(' '));
    });



    Ember.Handlebars.helper('truncate_tag', function(value, options) {

        var truncatedString = value.substring(0, 30).split(',').join('');

        var escaped = Handlebars.Utils.escapeExpression(truncatedString);
        return new Handlebars.SafeString(escaped);
    });



    App.Key = Ember.Object.extend({
    data: null
});

App.Crypt = Ember.Object.extend({
    uri: null,
    ip: null,
    hmac: null,
    tag: null,
    created: null,
    decrypted: null,
    message: null
});

App.ApplicationRoute = Ember.Route.extend({
    model: function() {

        var crypts = $.ajax({
            type: 'GET',
            url: "/crypts"
        }).done(function(data) {
            console.log(data);
            return data;
        });

        return crypts;
    }
});

App.ApplicationController = Ember.Controller.extend({

    keypad: ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"],

    keys: Ember.A([]),

    keyCounter: null,

    passList: null,

    crypt: null,

    crypts: Ember.A([]),

    cryptUpdate: function() {
        var controller = this,
            crypts = controller.get('crypts'),
            model = controller.get('model');

        model.forEach(function(crypt){

            var newCrypt = App.Crypt.create({
                uri: crypt.uri,
                ip: crypt.ip,
                tag: crypt.tag,
                decrypted: crypt.decrypted,
                hmac: crypt.hmac,
                message: crypt.message,
                created: crypt.created
            });

            crypts.unshiftObject(newCrypt);

        });
    }.observes('model'),

    keysUpdate: function() {
        var controller = this,
            keys = controller.get('keys');

        console.log(keys.length);

    }.observes('keys'),

    init: function() {

        IV = forge.random.getBytesSync(16);

        $('.crypt-container').affix({
            offset: {
                top: 100
                , bottom: function () {
                    return (this.bottom = $('.footer').outerHeight(true))
                }
            }
        });
    },

    actions: {

        submitKey: function(uri) {
            var controller = this,
                crypts = controller.get('crypts'),
                key = $('input.decrypt').val();
            $.ajax({
                type: 'POST',
                url: "/crypts/"+uri,
                data: {
                    key: key
                },
                context: document.body
            }).done(function(data) {

                console.log(data);

               var c = crypts.findBy('uri', uri),
                    msg, dec;

                if(data.message === undefined){
                        msg = "No whispers for you!"
                        dec = false;
                    } else {
                        msg = data.message;
                        dec = true;
                    }

                c.setProperties({ message: msg, decrypted: dec });

                console.log('sent');
            });
        },

        getCrypt: function(uri) {
            var controller = this;

            var crypts = $.ajax({
                type: 'GET',
                url: "/" + uri,
            }).done(function (data) {
                console.log(data);
                controller.set('crypt', data);
            });
        },

        addKey: function(item){

            var controller = this;
            var key = App.Key.create({
                data: item
            });

            console.log(key);
            var keys = controller.get('keys');
            keys.pushObject(key);


            if(keys.length < 6){
                controller.set('keyCounter',"width: "+keys.length*14+"%; background-color: red;");
            } else {

                controller.set('keyCounter',"width: "+keys.length*14+"%; background-color: #428bca;");
            }

        },

        deleteKey: function(key){

            var controller = this;
            var keys = controller.get('keys');
            keys.removeObject(key);

            if(keys.length < 6){
                controller.set('keyCounter',"width: "+keys.length*14+"%; background-color: red;");
                $('input.submission').prop('highlight', true);
            } else {
                $('input.submission').prop('hightlight', false);
                controller.set('keyCounter',"width: "+keys.length*14+"%; background-color: #428bca;");
            }

        },

        generateKeys: function() {

            var controller = this,
                crypts = controller.get('crypts'),
                message = $('input.submission').val(),
                pass = [],
                keys = controller.get('keys').forEach(function(key){
                    pass.push(key.data);
                });

            if(pass && pass.length > 2 && message && message.split('').length > 6){
                var tag = pass.join();

                // Salt is generated per request, IV is generated per session. Thinking of uploading the IV on APP open, then anything after that should follow from the emitting IP. No MITM.
                var salt = forge.random.getBytesSync(128);
                var derivedKey = forge.pkcs5.pbkdf2(tag, salt, '10660', 16);

                // encrypt some bytes using CBC mode
                // (other modes include: CFB, OFB, and CTR)

                var cipher = forge.aes.createEncryptionCipher(derivedKey, 'CBC');
                cipher.start(IV);
                cipher.update(forge.util.createBuffer(message));
                cipher.finish();
                var encrypted = cipher.output;

                var hmac = forge.hmac.create();
                hmac.start('sha256',  derivedKey);
                hmac.update(encrypted.toHex());
                /*
                 // CHANGE BELOW TO ONLY OPPERATE ON THE SERVER.
                 var convertFromHex = forge.util.hexToBytes("1e211539e5f01b6e897a0086d6a4733cea72a1b946ec1ca0d7cc0978ff9b2bfa");
                 var buffer = forge.util.createBuffer(convertFromHex, 'raw');

                 var newIV = forge.util.hexToBytes("e10e2b354a8e91f720eadd3719bee21c");

                 var cipher = forge.aes.createDecryptionCipher(derivedKey, 'CBC');
                 cipher.start(newIV);
                 console.log(IV); <-- Double check we don't have bleed here.
                 cipher.update(buffer);
                 cipher.finish();
                 console.log(cipher.output);
                 */

                $('input.decrypt').val(forge.util.bytesToHex(derivedKey));

                $.ajax({
                    type: 'POST',
                    url: "/crypts",
                    data: {
                        hmac: hmac.digest().toHex(),
                        iv: forge.util.bytesToHex(IV),
                        tag: tag,
                        uri: encrypted.toHex(),
                        message: encrypted.toHex()
                    },
                    context: document.body
                }).done(function(data) {

                    console.log(data);
                    var crypt = App.Crypt.create({
                        uri: data.uri,
                        ip: data.ip,
                        message: data.message,
                        hmac: data.hmac,
                        iv: data.iv,
                        tag: data.tag,
                        created: data.created

                    });
                    crypts.unshiftObject(crypt)
                });

            } else {
                $('input.submission').attr('placeholder', "You must choose at least 4 keys from the keypad and include a message...")
                $('input.decrypt').attr('placeholder', "You must choose at least 4 keys from the keypad and include a message...")
                console.log('Nope')
            }

        },

        commentCrypt: function(uri){

            var controller = this;

            window.open("/comments/"+uri, "", "width=600, height=260");

        }
}
});

});