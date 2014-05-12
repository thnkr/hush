require(['ember','forge'], function(Ember, forge){

App = Ember.Application.create({

});

App.Router.map(function() {
  // put your routes here
});

App.Key = Ember.Object.extend({
	data: null,
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return ['c'];
  }
});

App.ApplicationController = Ember.Controller.extend({

	keypad: ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p"],

	keys: Ember.A([]),

	passList: null,

    init: function() {

        SALT = forge.random.getBytesSync(128);
        IV = forge.random.getBytesSync(16);

    },

	actions: {

		addKey: function(item){

			var controller = this;
			var key = App.Key.create({
				data: item
			});

			console.log(key);
			var keys = controller.get('keys');
			keys.pushObject(key);
		},

		deleteKey: function(key){
			var controller = this;
			var keys = controller.get('keys');
			keys.removeObject(key);
		},

		generateKeys: function() {

			var controller = this,
				//message = $('input.submission').val(),
                message= 'Test Message.com <<- change',
				pass = [],
				keys = controller.get('keys').forEach(function(key){
					pass.push(key.data);
				});
                var password = pass.join();

            //var derivedKey = forge.pkcs5.pbkdf2(password, SALT, '10660', 16);
            //var tmpDK = forge.util.bytesToHex(derivedKey);
            var convertFromHex = forge.util.hexToBytes("9c63712fe8ffa6543bcc7a9fb4dd23ba");
            var derivedKey = forge.util.createBuffer(convertFromHex, 'raw');
            //var tmpDK = 9c63712fe8ffa6543bcc7a9fb4dd23ba', 16).toString(16);
            //var derivedKey = forge.util.hexToBytes(tmpDK);
            //var derivedKey = forge.random.getBytesSync(16);
            var hmac = forge.hmac.create();
            hmac.start('sha256',  derivedKey);
            hmac.update(message);

            // encrypt some bytes using CBC mode
            // (other modes include: CFB, OFB, and CTR)
            /*
            var cipher = forge.aes.createEncryptionCipher(derivedKey, 'CBC');
            cipher.start(IV);

            cipher.update(forge.util.createBuffer(message));
            cipher.finish();
            var encrypted = cipher.output;

            console.log('ENCRYPTED');
            console.log(encrypted.toHex());
            */
            // CHANGE BELOW TO ONLY OPPERATE ON THE SERVER.
            var convertFromHex = forge.util.hexToBytes("1e211539e5f01b6e897a0086d6a4733cea72a1b946ec1ca0d7cc0978ff9b2bfa");
            var buffer = forge.util.createBuffer(convertFromHex, 'raw');

            var newIV = forge.util.hexToBytes("e10e2b354a8e91f720eadd3719bee21c");

            var cipher = forge.aes.createDecryptionCipher(derivedKey, 'CBC');
            cipher.start(newIV);
            console.log(IV);
            cipher.update(buffer);
            cipher.finish();
            // outputs decrypted hex
            console.log('DECRYPTED');
            console.log(cipher.output);

            /*
            console.log('MESSAGE');
            console.log(message);
            console.log('SALT');
            console.log(SALT);
            console.log('DERIVED');
            console.log(derivedKey);
            console.log('HMAC')
            console.log(hmac.digest().toHex());*/

        	$('div.message').html(hmac.digest().toHex());
        	/*
            $.ajax({
        	  type: 'POST',
        	    url: "http://localhost:3000/new",
        	    data: { key: '000' },
        	    context: document.body
        	  }).done(function() {
        	    console.log('sent');
        	});
        	*/

		}
	}
});
    // RequireJS --> end.
});
