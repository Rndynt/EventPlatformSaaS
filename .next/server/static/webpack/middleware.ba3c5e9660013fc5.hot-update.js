"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("middleware",{

/***/ "(middleware)/./middleware.ts":
/*!***********************!*\
  !*** ./middleware.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   config: () => (/* binding */ config),\n/* harmony export */   middleware: () => (/* binding */ middleware)\n/* harmony export */ });\n/* harmony import */ var _lib_middleware_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/middleware/auth */ \"(middleware)/./lib/middleware/auth.ts\");\n\nasync function middleware(request) {\n    return await (0,_lib_middleware_auth__WEBPACK_IMPORTED_MODULE_0__.createAuthMiddleware)()(request);\n}\nconst config = {\n    matcher: [\n        /*\n     * Match all request paths except for the ones starting with:\n     * - api (API routes)\n     * - _next/static (static files)\n     * - _next/image (image optimization files)\n     * - favicon.ico (favicon file)\n     */ '/((?!_next/static|_next/image|favicon.ico).*)'\n    ]\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKG1pZGRsZXdhcmUpLy4vbWlkZGxld2FyZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFDNkQ7QUFFdEQsZUFBZUMsV0FBV0MsT0FBb0I7SUFDbkQsT0FBTyxNQUFNRiwwRUFBb0JBLEdBQUdFO0FBQ3RDO0FBRU8sTUFBTUMsU0FBUztJQUNwQkMsU0FBUztRQUNQOzs7Ozs7S0FNQyxHQUNEO0tBQ0Q7QUFDSCxFQUFFIiwic291cmNlcyI6WyIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL21pZGRsZXdhcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QgfSBmcm9tICduZXh0L3NlcnZlcic7XG5pbXBvcnQgeyBjcmVhdGVBdXRoTWlkZGxld2FyZSB9IGZyb20gJ0AvbGliL21pZGRsZXdhcmUvYXV0aCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWRkbGV3YXJlKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHJldHVybiBhd2FpdCBjcmVhdGVBdXRoTWlkZGxld2FyZSgpKHJlcXVlc3QpO1xufVxuXG5leHBvcnQgY29uc3QgY29uZmlnID0ge1xuICBtYXRjaGVyOiBbXG4gICAgLypcbiAgICAgKiBNYXRjaCBhbGwgcmVxdWVzdCBwYXRocyBleGNlcHQgZm9yIHRoZSBvbmVzIHN0YXJ0aW5nIHdpdGg6XG4gICAgICogLSBhcGkgKEFQSSByb3V0ZXMpXG4gICAgICogLSBfbmV4dC9zdGF0aWMgKHN0YXRpYyBmaWxlcylcbiAgICAgKiAtIF9uZXh0L2ltYWdlIChpbWFnZSBvcHRpbWl6YXRpb24gZmlsZXMpXG4gICAgICogLSBmYXZpY29uLmljbyAoZmF2aWNvbiBmaWxlKVxuICAgICAqL1xuICAgICcvKCg/IV9uZXh0L3N0YXRpY3xfbmV4dC9pbWFnZXxmYXZpY29uLmljbykuKiknLFxuICBdLFxufTsiXSwibmFtZXMiOlsiY3JlYXRlQXV0aE1pZGRsZXdhcmUiLCJtaWRkbGV3YXJlIiwicmVxdWVzdCIsImNvbmZpZyIsIm1hdGNoZXIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(middleware)/./middleware.ts\n");

/***/ })

});