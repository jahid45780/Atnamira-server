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
exports.ContactController = void 0;
const contact_service_1 = require("./contact.service");
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const getContact = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_service_1.ContactService.getContact();
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Contact information retrieved successfully",
        data: result,
    });
}));
const createContact = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_service_1.ContactService.createContact(req.body);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: 201,
        success: true,
        message: "Contact information created successfully",
        data: result,
    });
}));
const updateContact = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield contact_service_1.ContactService.updateContact(req.body);
    (0, sendResponse_1.sentResponse)(res, {
        statusCode: 200,
        success: true,
        message: "Contact information updated successfully",
        data: result,
    });
}));
exports.ContactController = {
    getContact,
    createContact,
    updateContact,
};
