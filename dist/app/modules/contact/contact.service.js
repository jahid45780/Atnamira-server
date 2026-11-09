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
exports.ContactService = void 0;
const contact_model_1 = require("./contact.model");
const getContact = () => __awaiter(void 0, void 0, void 0, function* () {
    const contact = yield contact_model_1.Contact.findOne();
    return contact;
});
const createContact = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingContact = yield contact_model_1.Contact.findOne();
    if (existingContact) {
        throw new Error("Contact information already exists");
    }
    const contact = yield contact_model_1.Contact.create(payload);
    return contact;
});
const updateContact = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingContact = yield contact_model_1.Contact.findOne();
    if (!existingContact) {
        const contact = yield contact_model_1.Contact.create(payload);
        return contact;
    }
    const contact = yield contact_model_1.Contact.findByIdAndUpdate(existingContact._id, payload, {
        new: true,
        runValidators: true,
    });
    return contact;
});
exports.ContactService = {
    getContact,
    createContact,
    updateContact,
};
