// source: https://github.com/AlienKevin/html-element-picker/blob/master/src/ElementPicker.js

(function () {
    class ElementPicker {
        constructor(options) {
            // MUST create hover box first before applying options
            this.hoverBox = document.createElement("div");
            this.hoverBox.style.position = "absolute";
            this.hoverBox.style.pointerEvents = "none";
            this.hoverBox.style.zIndex = "9999";

            const defaultOptions = {
                container: document.body,
                selectors: "*", // default to pick all elements
                background: "rgba(153, 235, 255, 0.5)", // transparent light blue
                borderWidth: 5,
                transition: "all 150ms ease", // set to "" (empty string) to disable
                ignoreElements: [document.body],
                action: {},
            }
            const mergedOptions = {
                ...defaultOptions,
                ...options
            };
            Object.keys(mergedOptions).forEach((key) => {
                this[key] = mergedOptions[key];
            });

            this._detectMouseMove = (e) => {
                console.log('mouse move...');
                this._previousEvent = e;
                let target = e.target;
                // console.log("TCL: ElementPicker -> this._moveHoverBox -> target", target)
                if (this.ignoreElements.indexOf(target) === -1 && target.matches(this.selectors) &&
                    this.container.contains(target) ||
                    target === this.hoverBox) { // is NOT ignored elements
                    // console.log("TCL: target", target);
                    if (target === this.hoverBox) {
                        // the truely hovered element behind the added hover box
                        const hoveredElement = document.elementsFromPoint(e.clientX, e.clientY)[1];
                        // console.log("screenX: " + e.screenX);
                        // console.log("screenY: " + e.screenY);
                        // console.log("TCL: hoveredElement", hoveredElement);
                        if (this._previousTarget === hoveredElement) {
                            // avoid repeated calculation and rendering
                            return;
                        } else {
                            target = hoveredElement;
                        }
                    } else {
                        this._previousTarget = target;
                    }
                    const targetOffset = target.getBoundingClientRect();
                    const targetHeight = targetOffset.height;
                    const targetWidth = targetOffset.width;

                    this.hoverBox.style.width = targetWidth + this.borderWidth * 2 + "px";
                    this.hoverBox.style.height = targetHeight + this.borderWidth * 2 + "px";
                    // need scrollX and scrollY to account for scrolling
                    this.hoverBox.style.top = targetOffset.top + window.scrollY - this.borderWidth + "px";
                    this.hoverBox.style.left = targetOffset.left + window.scrollX - this.borderWidth + "px";
                    if (this._triggered && this.action.callback) {
                        this.action.callback(target);
                        this._triggered = false;
                    }
                } else {
                    // console.log("hiding hover box...");
                    this.hoverBox.style.width = 0;
                }
            };
            document.addEventListener("mousemove", this._detectMouseMove);
        }
        get container() {
            return this._container;
        }
        set container(value) {
            if (value instanceof HTMLElement) {
                this._container = value;
                this.container.appendChild(this.hoverBox);
            } else {
                throw new Error("Please specify an HTMLElement as container!");
            }
        }
        get background() {
            return this._background;
        }
        set background(value) {
            this._background = value;

            this.hoverBox.style.background = this.background;
        }
        get transition() {
            return this._transition;
        }
        set transition(value) {
            this._transition = value;

            this.hoverBox.style.transition = this.transition;
        }
        get borderWidth() {
            return this._borderWidth;
        }
        set borderWidth(value) {
            this._borderWidth = value;

            this._redetectMouseMove();
        }
        get selectors() {
            return this._selectors;
        }
        set selectors(value) {
            this._selectors = value;

            this._redetectMouseMove();
        }
        get ignoreElements() {
            return this._ignoreElements;
        }
        set ignoreElements(value) {
            this._ignoreElements = value;

            this._redetectMouseMove();
        }
        get action() {
            return this._action;
        }
        set action(value) {
            if (value instanceof Object) {
                if (typeof value.trigger === "string" &&
                    typeof value.callback === "function") {
                    if (this._triggerListener) {
                        document.removeEventListener(this.action.trigger, this._triggerListener);
                        this._triggered = false;
                    }
                    this._action = value;

                    this._triggerListener = (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        this._triggered = true;
                        this._redetectMouseMove();
                    }
                    document.addEventListener(this.action.trigger, this._triggerListener, true);
                } else if (value.trigger !== undefined || value.callback !== undefined) { // allow empty action object
                    throw new Error("action must include two keys: trigger (String) and callback (function)!");
                }
            } else {
                throw new Error("action must be an object!");
            }
        }
        close() {
            this.hoverBox.remove()

            // cuiliang: remove event listener
            document.removeEventListener("mousemove", this._detectMouseMove);
            document.removeEventListener(this.action.trigger, this._triggerListener, true);
        }
        _redetectMouseMove() {
            if (this._detectMouseMove && this._previousEvent) {
                this._detectMouseMove(this._previousEvent);
            }
        }
    }
    // export module
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = ElementPicker;
    } else {
        window.ElementPicker = ElementPicker;
    }
})();

// https://github.com/antonmedv/finder
// Generate css selector for element
var Limit;
(function (Limit) {
    Limit[Limit["All"] = 0] = "All";
    Limit[Limit["Two"] = 1] = "Two";
    Limit[Limit["One"] = 2] = "One";
})(Limit || (Limit = {}));

(function () {
    class PathFinder {

        constructor() {
            this.config = undefined;
            this.rootDocument = undefined;
        }

        finder(input, options) {
            if (input.nodeType !== Node.ELEMENT_NODE) {
                throw new Error(`Can't generate CSS selector for non-element node type.`);
            }
            if ("html" === input.tagName.toLowerCase()) {
                return "html";
            }
            const defaults = {
                root: document.body,
                idName: (name) => true,
                className: (name) => true,
                tagName: (name) => true,
                attr: (name, value) => false,
                seedMinLength: 1,
                optimizedMinLength: 2,
                threshold: 1000,
                maxNumberOfTries: 10000,
            };
            this.config = Object.assign(Object.assign({}, defaults), options);
            this.rootDocument = this.findRootDocument(this.config.root, defaults);
            let path = this.bottomUpSearch(input, Limit.All, () => this.bottomUpSearch(input, Limit.Two, () => this.bottomUpSearch(input, Limit.One)));
            if (path) {
                const optimized = this.sort(this.optimize(path, input));
                if (optimized.length > 0) {
                    path = optimized[0];
                }
                return this.selector(path);
            }
            else {
                throw new Error(`Selector was not found.`);
            }
        }

        findRootDocument(rootNode, defaults) {
            if (rootNode.nodeType === Node.DOCUMENT_NODE) {
                return rootNode;
            }
            if (rootNode === defaults.root) {
                return rootNode.ownerDocument;
            }
            return rootNode;
        }

        bottomUpSearch(input, limit, fallback) {
            let path = null;
            let stack = [];
            let current = input;
            let i = 0;
            while (current && current !== this.config.root.parentElement) {
                let level = this.maybe(this.id(current)) ||
                    this.maybe(...this.attr(current)) ||
                    this.maybe(...this.classNames(current)) ||
                    this.maybe(this.tagName(current)) || [this.any()];
                const nth = this.index(current);
                if (limit === Limit.All) {
                    if (nth) {
                        level = level.concat(level.filter(this.dispensableNth).map((node) => this.nthChild(node, nth)));
                    }
                }
                else if (limit === Limit.Two) {
                    level = level.slice(0, 1);
                    if (nth) {
                        level = level.concat(level.filter(this.dispensableNth).map((node) => this.nthChild(node, nth)));
                    }
                }
                else if (limit === Limit.One) {
                    const [node] = (level = level.slice(0, 1));
                    if (nth && this.dispensableNth(node)) {
                        level = [this.nthChild(node, nth)];
                    }
                }
                for (let node of level) {
                    node.level = i;
                }
                stack.push(level);
                if (stack.length >= this.config.seedMinLength) {
                    path = this.findUniquePath(stack, fallback);
                    if (path) {
                        break;
                    }
                }
                current = current.parentElement;
                i++;
            }
            if (!path) {
                path = this.findUniquePath(stack, fallback);
            }
            return path;
        }

        findUniquePath(stack, fallback) {
            const paths = this.sort(this.combinations(stack));
            if (paths.length > this.config.threshold) {
                return fallback ? fallback() : null;
            }
            for (let candidate of paths) {
                if (this.unique(candidate)) {
                    return candidate;
                }
            }
            return null;
        }

        selector(path) {
            let node = path[0];
            let query = node.name;
            for (let i = 1; i < path.length; i++) {
                const level = path[i].level || 0;
                if (node.level === level - 1) {
                    query = `${path[i].name} > ${query}`;
                }
                else {
                    query = `${path[i].name} ${query}`;
                }
                node = path[i];
            }
            return query;
        }

        penalty(path) {
            return path.map((node) => node.penalty).reduce((acc, i) => acc + i, 0);
        }

        unique(path) {
            switch (this.rootDocument.querySelectorAll(this.selector(path)).length) {
                case 0:
                    throw new Error(`Can't select any node with this selector: ${selector(path)}`);
                case 1:
                    return true;
                default:
                    return false;
            }
        }

        id(input) {
            const elementId = input.getAttribute("id");
            if (elementId && this.config.idName(elementId)) {
                return {
                    name: "#" + this.cssesc(elementId, { isIdentifier: true }),
                    penalty: 0,
                };
            }
            return null;
        }

        attr(input) {
            const attrs = Array.from(input.attributes).filter((attr) => this.config.attr(attr.name, attr.value));
            return attrs.map((attr) => ({
                name: "[" +
                    this.cssesc(attr.name, { isIdentifier: true }) +
                    '="' +
                    this.cssesc(attr.value) +
                    '"]',
                penalty: 0.5,
            }));
        }

        classNames(input) {
            const names = Array.from(input.classList).filter(this.config.className);
            return names.map((name) => ({
                name: "." + this.cssesc(name, { isIdentifier: true }),
                penalty: 1,
            }));
        }

        tagName(input) {
            const name = input.tagName.toLowerCase();
            if (this.config.tagName(name)) {
                return {
                    name,
                    penalty: 2,
                };
            }
            return null;
        }

        any() {
            return {
                name: "*",
                penalty: 3,
            };
        }

        index(input) {
            const parent = input.parentNode;
            if (!parent) {
                return null;
            }
            let child = parent.firstChild;
            if (!child) {
                return null;
            }
            let i = 0;
            while (child) {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    i++;
                }
                if (child === input) {
                    break;
                }
                child = child.nextSibling;
            }
            return i;
        }

        nthChild(node, i) {
            return {
                name: node.name + `:nth-child(${i})`,
                penalty: node.penalty + 1,
            };
        }

        dispensableNth(node) {
            return node.name !== "html" && !node.name.startsWith("#");
        }

        maybe(...level) {
            const list = level.filter(this.notEmpty);
            if (list.length > 0) {
                return list;
            }
            return null;
        }

        notEmpty(value) {
            return value !== null && value !== undefined;
        }

        * combinations(stack, path = []) {
            if (stack.length > 0) {
                for (let node of stack[0]) {
                    yield* this.combinations(stack.slice(1, stack.length), path.concat(node));
                }
            }
            else {
                yield path;
            }
        }

        sort(paths) {
            return Array.from(paths).sort((a, b) => this.penalty(a) - this.penalty(b));
        }

        * optimize(path, input, scope = {
            counter: 0,
            visited: new Map(),
        }) {
            if (path.length > 2 && path.length > this.config.optimizedMinLength) {
                for (let i = 1; i < path.length - 1; i++) {
                    if (scope.counter > this.config.maxNumberOfTries) {
                        return; // Okay At least I tried!
                    }
                    scope.counter += 1;
                    const newPath = [...path];
                    newPath.splice(i, 1);
                    const newPathKey = this.selector(newPath);
                    if (scope.visited.has(newPathKey)) {
                        return;
                    }
                    if (this.unique(newPath) && this.same(newPath, input)) {
                        yield newPath;
                        scope.visited.set(newPathKey, true);
                        yield* this.optimize(newPath, input, scope);
                    }
                }
            }
        }

        same(path, input) {
            return this.rootDocument.querySelector(this.selector(path)) === input;
        }

        static regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
        static regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
        static regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
        static defaultOptions = {
            escapeEverything: false,
            isIdentifier: false,
            quotes: "single",
            wrap: false,
        };

        cssesc(string, opt = {}) {
            const options = Object.assign(Object.assign({}, PathFinder.defaultOptions), opt);
            if (options.quotes != "single" && options.quotes != "double") {
                options.quotes = "single";
            }
            const quote = options.quotes == "double" ? '"' : "'";
            const isIdentifier = options.isIdentifier;
            const firstChar = string.charAt(0);
            let output = "";
            let counter = 0;
            const length = string.length;
            while (counter < length) {
                const character = string.charAt(counter++);
                let codePoint = character.charCodeAt(0);
                let value = void 0;
                // If it’s not a printable ASCII character…
                if (codePoint < 0x20 || codePoint > 0x7e) {
                    if (codePoint >= 0xd800 && codePoint <= 0xdbff && counter < length) {
                        // It’s a high surrogate, and there is a next character.
                        const extra = string.charCodeAt(counter++);
                        if ((extra & 0xfc00) == 0xdc00) {
                            // next character is low surrogate
                            codePoint = ((codePoint & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
                        }
                        else {
                            // It’s an unmatched surrogate; only append this code unit, in case
                            // the next code unit is the high surrogate of a surrogate pair.
                            counter--;
                        }
                    }
                    value = "\\" + codePoint.toString(16).toUpperCase() + " ";
                }
                else {
                    if (options.escapeEverything) {
                        if (PathFinder.regexAnySingleEscape.test(character)) {
                            value = "\\" + character;
                        }
                        else {
                            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
                        }
                    }
                    else if (/[\t\n\f\r\x0B]/.test(character)) {
                        value = "\\" + codePoint.toString(16).toUpperCase() + " ";
                    }
                    else if (character == "\\" ||
                        (!isIdentifier &&
                            ((character == '"' && quote == character) ||
                                (character == "'" && quote == character))) ||
                        (isIdentifier && PathFinder.regexSingleEscape.test(character))) {
                        value = "\\" + character;
                    }
                    else {
                        value = character;
                    }
                }
                output += value;
            }
            if (isIdentifier) {
                if (/^-[-\d]/.test(output)) {
                    output = "\\-" + output.slice(1);
                }
                else if (/\d/.test(firstChar)) {
                    output = "\\3" + firstChar + " " + output.slice(1);
                }
            }
            // Remove spaces after `\HEX` escapes that are not followed by a hex digit,
            // since they’re redundant. Note that this is only possible if the escape
            // sequence isn’t preceded by an odd number of backslashes.
            output = output.replace(PathFinder.regexExcessiveSpaces, function ($0, $1, $2) {
                if ($1 && $1.length % 2) {
                    // It’s not safe to remove the space, so don’t.
                    return $0;
                }
                // Strip the space.
                return ($1 || "") + $2;
            });
            if (!isIdentifier && options.wrap) {
                return quote + output + quote;
            }
            return output;
        }

    }

    // export module
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = PathFinder;
    } else {
        window.PathFinder = PathFinder;
    }

})();

// 开始选择元素
//
var picker = new ElementPicker({
    container: document.body,
    selectors: "*",
    background: "rgba(153, 235, 255, 0.5)",
    borderWidth: 5,
    transition: "all 150ms ease",
    ignoreElements: [document.body],
    action: {
        trigger: 'click',
        callback: (function (target) {
            console.log('element selected:', target);
            const selector = new PathFinder().finder(target);
            console.log(selector);


            picker.close();
            delete picker;
        })
    }
});