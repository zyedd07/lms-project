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
exports.deleteHelpSectionService = exports.updateHelpSectionService = exports.createHelpSectionService = exports.getAllHelpSectionsService = void 0;
const HelpCenter_model_1 = __importDefault(require("../models/HelpCenter.model"));
const httpError_1 = __importDefault(require("../utils/httpError"));
/**
 * Service to get all help center sections, ordered by the 'order' field.
 */
const getAllHelpSectionsService = () => __awaiter(void 0, void 0, void 0, function* () {
    return HelpCenter_model_1.default.findAll({
        order: [['order', 'ASC']],
    });
});
exports.getAllHelpSectionsService = getAllHelpSectionsService;
/**
 * Service to create a new help center section.
 */
const createHelpSectionService = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content, order } = params;
    // The 'as any' is used here because sequelize.define returns a generic ModelStatic
    // which doesn't have the specific attributes typed. This is a common workaround.
    const newSection = yield HelpCenter_model_1.default.create({ title, content, order });
    return newSection;
});
exports.createHelpSectionService = createHelpSectionService;
/**
 * Service to update an existing help center section by its ID.
 */
const updateHelpSectionService = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const section = yield HelpCenter_model_1.default.findByPk(id);
    if (!section) {
        throw new httpError_1.default('Help section not found', 404);
    }
    yield section.update(updates);
    return section;
});
exports.updateHelpSectionService = updateHelpSectionService;
/**
 * Service to delete a help center section by its ID.
 */
const deleteHelpSectionService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const section = yield HelpCenter_model_1.default.findByPk(id);
    if (!section) {
        throw new httpError_1.default('Help section not found', 404);
    }
    yield section.destroy();
    return true;
});
exports.deleteHelpSectionService = deleteHelpSectionService;
