"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooltipProvider = exports.TooltipContent = exports.TooltipTrigger = exports.Tooltip = void 0;
var React = require("react");
var TooltipPrimitive = require("@radix-ui/react-tooltip");
var utils_1 = require("../../lib/utils");
var TooltipProvider = function (_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (React.createElement(TooltipPrimitive.Provider, __assign({}, props), children));
};
exports.TooltipProvider = TooltipProvider;
var Tooltip = TooltipPrimitive.Root;
exports.Tooltip = Tooltip;
var TooltipTrigger = TooltipPrimitive.Trigger;
exports.TooltipTrigger = TooltipTrigger;
var TooltipContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.sideOffset, sideOffset = _b === void 0 ? 4 : _b, props = __rest(_a, ["className", "sideOffset"]);
    return (React.createElement(TooltipPrimitive.Portal, null,
        React.createElement(TooltipPrimitive.Content, __assign({ ref: ref, sideOffset: sideOffset, className: (0, utils_1.cn)("z-50 overflow-hidden rounded-md bg-[#10131a] px-4 py-2 text-sm font-medium text-white leading-relaxed shadow-xl max-w-[280px] whitespace-pre-line break-words", className) }, props))));
});
exports.TooltipContent = TooltipContent;
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
