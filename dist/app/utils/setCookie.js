"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = void 0;
const setAuthCookie = (res, tokenInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (tokenInfo.accessToken) {
        res.cookie("AccessToken", tokenInfo.accessToken, {
            httpOnly: true,
            secure: true,
            //  secure:envVers.NODE_ENV === "production",
            sameSite: "none"
        });
    }
    if (tokenInfo.refreshToken) {
        res.cookie("RefreshToken", tokenInfo.refreshToken, {
            httpOnly: true,
            secure: true,
            //  secure:envVers.NODE_ENV === "production",
            sameSite: "none"
        });
    }
});
exports.setAuthCookie = setAuthCookie;
