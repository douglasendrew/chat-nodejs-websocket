const CryptoJS = require('crypto-js');
const secretKey = 'amplimed';

module.exports = {
    encrypt(text) {
        const ciphertext = CryptoJS.AES.encrypt(text, secretKey).toString();
        return ciphertext;
    },
    decrypt(ciphertext) {
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    }
}