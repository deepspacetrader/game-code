import CryptoJS from 'crypto-js';

const SALT = 'wow_coolSaltStringIthinkthisisprettyNeatAndFunkylol';

// Encrypt data with MD5 hash of the data + salt
export const encryptData = (data) => {
    try {
        const dataString = JSON.stringify(data);
        const hash = CryptoJS.MD5(dataString + SALT).toString();
        const encrypted = CryptoJS.AES.encrypt(dataString, SALT).toString();
        return JSON.stringify({ data: encrypted, hash });
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
};

// Decrypt and verify data
export const decryptData = (encryptedData) => {
    try {
        const { data: encrypted, hash } = JSON.parse(encryptedData);
        const bytes = CryptoJS.AES.decrypt(encrypted, SALT);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        // Verify the hash
        const calculatedHash = CryptoJS.MD5(decrypted + SALT).toString();
        if (calculatedHash !== hash) {
            console.error('Data integrity check failed - possible tampering detected');
            return null;
        }

        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
};
