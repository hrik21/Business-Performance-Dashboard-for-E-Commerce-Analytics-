"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@testing-library/react");
const App_1 = __importDefault(require("../App"));
describe('App Component', () => {
    it('renders the main heading', () => {
        (0, react_1.render)(<App_1.default />);
        const heading = react_1.screen.getByText(/E-commerce BI Dashboard/i);
        expect(heading).toBeInTheDocument();
    });
    it('shows development setup message', () => {
        (0, react_1.render)(<App_1.default />);
        const message = react_1.screen.getByText(/Development environment setup complete!/i);
        expect(message).toBeInTheDocument();
    });
});
