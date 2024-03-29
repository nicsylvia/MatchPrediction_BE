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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send_message = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const googleapis_1 = require("googleapis");
// Not changing
const GOOGLE_REDIRECT = "https://developers.google.com/oauthplayground";
// Not changing
const GOOGLE_ID = "24372524741-jn16e1i5tcijldtr4ipcn55rtje4am4j.apps.googleusercontent.com";
//   Not changing
const GOOGLE_SECRET = "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";
// Changing - Get it from google api , use the redirect link to work on that
const GOOGLE_REFRESHTOKEN = "1//04GUtuw7JeuxYCgYIARAAGAQSNwF-L9IroTMvzhkr6oNRxm63Cima8oRzQU4tIsivTj9EPBmDL9qUatQODhDhkP0qbP4qut3HUdE";
const oAuth = new googleapis_1.google.auth.OAuth2(GOOGLE_ID, GOOGLE_SECRET, GOOGLE_REDIRECT);
oAuth.setCredentials({ access_token: GOOGLE_REFRESHTOKEN });
// Verify each users on the platform:
const send_message = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const getToken = yield oAuth.getAccessToken();
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "nicsylvia15f@gmail.com",
                clientId: GOOGLE_ID,
                clientSecret: GOOGLE_SECRET,
                refreshToken: GOOGLE_REFRESHTOKEN,
                accessToken: getToken === null || getToken === void 0 ? void 0 : getToken.token,
            },
        });
        const mailerOptions = {
            from: user === null || user === void 0 ? void 0 : user.email,
            to: "nicsylvia15f@gmail.com",
            subject: "user from Match Prediction Platform",
            html: user === null || user === void 0 ? void 0 : user.message,
        };
        transporter
            .sendMail(mailerOptions)
            .then(() => {
            console.log("Message sent to Email successfully..");
        })
            .catch((err) => {
            console.log("Email transporter Error: ", err);
        });
    }
    catch (error) {
        console.log("An error occured in sending email", error);
    }
});
exports.send_message = send_message;
