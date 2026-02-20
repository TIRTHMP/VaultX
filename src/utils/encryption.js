import { encode as btoa, decode as atob } from "base-64";

export const encryptData = (text) => {
    return btoa(text);
};

export const decryptData = (cipher) => {
    return atob(cipher);
};
