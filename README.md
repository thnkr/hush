Hush Baby
=========
Basic messaging service to retain the thoughts of a small group of people.
https://medium.com/p/69ed8ce5628d

- Local libary encryptions with AES, SALT generated with keypad.  
- Dependant on Forge: https://github.com/digitalbazaar/forge
- The local app: https://github.com/thnkr/hush/blob/master/app/public/js/app.js
- The server: https://github.com/thnkr/hush/blob/master/server.js

### Key Generation
https://github.com/thnkr/hush/blob/master/app/public/js/app.js#L243

1. App init fired: IV is generated from a randombytes string (16 bytes). 

2. generateKeys button fired: SALT is generated (also with 16 bytes). 

3. A derived key is generated from the keypad combination set as the password input and the SALT. 10,0000 iterations outputting 16 bytes. 

4. From the derived key a hashed mac (HMAC) is created with Sha256. 

5. From the IV and derived key a keypair is generated.

6. Everything is converted from bytes to HEX and uploaded to the server (except for the private key which remains on the client). 

### Key Decryption
 
1. user visits: www.hushbaby.org, which responds with a JSON array of the public keys 

2. User sends a POST request with a decrypted key and the keypad combination. 

3. The server attempts to generate an HMAC from the keypad, private key combination. Rejects if newHMAC not equal oldHMAC.  (REF: https://github.com/thnkr/hush/blob/master/server.js#L119)

4. Server applies private key, updates the db with the decryption and responds with the fully decrypted object. 
