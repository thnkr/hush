Hush Baby
=========
Basic messaging service to retain the thoughts of a small group of people.
https://medium.com/p/69ed8ce5628d

- Local libary encryptions with AES, SALT generated with keypad.  
- Dependant on Forge: https://github.com/digitalbazaar/forge
- The local app: https://github.com/thnkr/hush/blob/master/app/public/js/app.js
- The server: https://github.com/thnkr/hush/blob/master/server.js

## Instructions
1. Generate your SALT by clicking keys on the keypad. A minimum of six is required. 

2. Write a message in the text box. The message can include links which will be converted to HTML. It does not support markdown or formatting.

3. Click "Write Log" and a key will appear above the text box and your message will show up encrypted in the log below. If you have trouble finding it you can always search for your tag within the page. 

4. Leave your key in the text box and click "Decrypt" to release your message to the public. OR retain your private key and decrypt it later. The database has no retention of your message, it was never sent the server. 

5. To verify the integrity and security of this project feel free to review the process listed below or dig into the source files.

### Security (Encryption)
https://github.com/thnkr/hush/blob/master/app/public/js/app.js#L243

1. App init fired: IV is generated from a randombytes string (16 bytes). 

2. generateKeys button fired: SALT is generated (also with 16 bytes). 

3. A derived key is generated from the keypad combination set as the password input and the SALT. 10,0000 iterations outputting 16 bytes. 

4. From the derived key a hashed mac (HMAC) is created with Sha256. 

5. From the IV and derived key a keypair is generated.

6. Everything is converted from bytes to HEX and uploaded to the server (except for the private key which remains on the client). 

### And Decryption...
 
1. user visits: www.hushbaby.org, which responds with a JSON array of the public keys 

2. User sends a POST request with a decrypted key and the keypad combination. 

3. The server attempts to generate an HMAC from the keypad, private key combination. Rejects if newHMAC not equal oldHMAC.  (REF: https://github.com/thnkr/hush/blob/master/server.js#L119)

4. Server applies private key, updates the db with the decryption and responds with the fully decrypted object. 
