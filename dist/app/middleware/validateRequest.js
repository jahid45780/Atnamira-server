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
exports.validateRequest = void 0;
const validateRequest = (schema) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validatedData = yield schema.parseAsync({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        // Body validation
        if (validatedData.body !== undefined) {
            req.body = validatedData.body;
        }
        // Params validation
        if (validatedData.params !== undefined) {
            req.params = validatedData.params;
        }
        // Query validation
        if (validatedData.query !== undefined) {
            req.query = validatedData.query;
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.validateRequest = validateRequest;
