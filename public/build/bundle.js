
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules\simple-svelte-autocomplete\src\SimpleAutocomplete.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$3 = "node_modules\\simple-svelte-autocomplete\\src\\SimpleAutocomplete.svelte";

    const get_no_results_slot_changes = dirty => ({
    	noResultsText: dirty[0] & /*noResultsText*/ 2
    });

    const get_no_results_slot_context = ctx => ({ noResultsText: /*noResultsText*/ ctx[1] });

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[79] = list[i];
    	child_ctx[81] = i;
    	return child_ctx;
    }

    const get_item_slot_changes = dirty => ({
    	item: dirty[0] & /*filteredListItems*/ 131072,
    	label: dirty[0] & /*filteredListItems*/ 131072
    });

    const get_item_slot_context = ctx => ({
    	item: /*listItem*/ ctx[79].item,
    	label: /*listItem*/ ctx[79].highlighted
    	? /*listItem*/ ctx[79].highlighted.label
    	: /*listItem*/ ctx[79].label
    });

    // (775:2) {#if showClear}
    function create_if_block_6(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "✖";
    			attr_dev(span, "class", "autocomplete-clear-button svelte-77usy");
    			add_location(span, file$3, 775, 4, 17914);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*clear*/ ctx[27], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(775:2) {#if showClear}",
    		ctx
    	});

    	return block;
    }

    // (812:28) 
    function create_if_block_5(ctx) {
    	let div;
    	let current;
    	const no_results_slot_template = /*#slots*/ ctx[50]["no-results"];
    	const no_results_slot = create_slot(no_results_slot_template, ctx, /*$$scope*/ ctx[49], get_no_results_slot_context);
    	const no_results_slot_or_fallback = no_results_slot || fallback_block_1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (no_results_slot_or_fallback) no_results_slot_or_fallback.c();
    			attr_dev(div, "class", "autocomplete-list-item-no-results svelte-77usy");
    			add_location(div, file$3, 812, 6, 19343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (no_results_slot_or_fallback) {
    				no_results_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (no_results_slot) {
    				if (no_results_slot.p && (!current || dirty[0] & /*noResultsText*/ 2 | dirty[1] & /*$$scope*/ 262144)) {
    					update_slot(no_results_slot, no_results_slot_template, ctx, /*$$scope*/ ctx[49], dirty, get_no_results_slot_changes, get_no_results_slot_context);
    				}
    			} else {
    				if (no_results_slot_or_fallback && no_results_slot_or_fallback.p && dirty[0] & /*noResultsText*/ 2) {
    					no_results_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(no_results_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(no_results_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (no_results_slot_or_fallback) no_results_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(812:28) ",
    		ctx
    	});

    	return block;
    }

    // (782:4) {#if filteredListItems && filteredListItems.length > 0}
    function create_if_block$3(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	let each_value = /*filteredListItems*/ ctx[17];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*maxItemsToShowInList*/ ctx[0] > 0 && /*filteredListItems*/ ctx[17].length > /*maxItemsToShowInList*/ ctx[0] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*highlightIndex, onListItemClick, filteredListItems, maxItemsToShowInList*/ 1212417 | dirty[1] & /*$$scope*/ 262144) {
    				each_value = /*filteredListItems*/ ctx[17];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*maxItemsToShowInList*/ ctx[0] > 0 && /*filteredListItems*/ ctx[17].length > /*maxItemsToShowInList*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(782:4) {#if filteredListItems && filteredListItems.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (814:48) {noResultsText}
    function fallback_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*noResultsText*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*noResultsText*/ 2) set_data_dev(t, /*noResultsText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(814:48) {noResultsText}",
    		ctx
    	});

    	return block;
    }

    // (784:8) {#if listItem && (maxItemsToShowInList <= 0 || i < maxItemsToShowInList)}
    function create_if_block_2$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*listItem*/ ctx[79] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*listItem*/ ctx[79]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*filteredListItems*/ 131072) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(784:8) {#if listItem && (maxItemsToShowInList <= 0 || i < maxItemsToShowInList)}",
    		ctx
    	});

    	return block;
    }

    // (785:10) {#if listItem}
    function create_if_block_3(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const item_slot_template = /*#slots*/ ctx[50].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[49], get_item_slot_context);
    	const item_slot_or_fallback = item_slot || fallback_block(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[53](/*listItem*/ ctx[79]);
    	}

    	function pointerenter_handler() {
    		return /*pointerenter_handler*/ ctx[54](/*i*/ ctx[81]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (item_slot_or_fallback) item_slot_or_fallback.c();

    			attr_dev(div, "class", div_class_value = "autocomplete-list-item " + (/*i*/ ctx[81] === /*highlightIndex*/ ctx[15]
    			? "selected"
    			: "") + " svelte-77usy");

    			add_location(div, file$3, 785, 12, 18369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler, false, false, false),
    					listen_dev(div, "pointerenter", pointerenter_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (item_slot) {
    				if (item_slot.p && (!current || dirty[0] & /*filteredListItems*/ 131072 | dirty[1] & /*$$scope*/ 262144)) {
    					update_slot(item_slot, item_slot_template, ctx, /*$$scope*/ ctx[49], dirty, get_item_slot_changes, get_item_slot_context);
    				}
    			} else {
    				if (item_slot_or_fallback && item_slot_or_fallback.p && dirty[0] & /*filteredListItems*/ 131072) {
    					item_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty[0] & /*highlightIndex*/ 32768 && div_class_value !== (div_class_value = "autocomplete-list-item " + (/*i*/ ctx[81] === /*highlightIndex*/ ctx[15]
    			? "selected"
    			: "") + " svelte-77usy")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(785:10) {#if listItem}",
    		ctx
    	});

    	return block;
    }

    // (798:16) {:else}
    function create_else_block$1(ctx) {
    	let html_tag;
    	let raw_value = /*listItem*/ ctx[79].label + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems*/ 131072 && raw_value !== (raw_value = /*listItem*/ ctx[79].label + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(798:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (796:16) {#if listItem.highlighted}
    function create_if_block_4(ctx) {
    	let html_tag;
    	let raw_value = /*listItem*/ ctx[79].highlighted.label + "";
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems*/ 131072 && raw_value !== (raw_value = /*listItem*/ ctx[79].highlighted.label + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(796:16) {#if listItem.highlighted}",
    		ctx
    	});

    	return block;
    }

    // (795:91)                  
    function fallback_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*listItem*/ ctx[79].highlighted) return create_if_block_4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(795:91)                  ",
    		ctx
    	});

    	return block;
    }

    // (783:6) {#each filteredListItems as listItem, i}
    function create_each_block$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*listItem*/ ctx[79] && (/*maxItemsToShowInList*/ ctx[0] <= 0 || /*i*/ ctx[81] < /*maxItemsToShowInList*/ ctx[0]) && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*listItem*/ ctx[79] && (/*maxItemsToShowInList*/ ctx[0] <= 0 || /*i*/ ctx[81] < /*maxItemsToShowInList*/ ctx[0])) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*filteredListItems, maxItemsToShowInList*/ 131073) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(783:6) {#each filteredListItems as listItem, i}",
    		ctx
    	});

    	return block;
    }

    // (807:6) {#if maxItemsToShowInList > 0 && filteredListItems.length > maxItemsToShowInList}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*filteredListItems*/ ctx[17].length - /*maxItemsToShowInList*/ ctx[0] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("...");
    			t1 = text(t1_value);
    			t2 = text(" results not shown");
    			attr_dev(div, "class", "autocomplete-list-item-no-results svelte-77usy");
    			add_location(div, file$3, 807, 8, 19152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems, maxItemsToShowInList*/ 131073 && t1_value !== (t1_value = /*filteredListItems*/ ctx[17].length - /*maxItemsToShowInList*/ ctx[0] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(807:6) {#if maxItemsToShowInList > 0 && filteredListItems.length > maxItemsToShowInList}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let input_1;
    	let input_1_class_value;
    	let input_1_id_value;
    	let input_1_autocomplete_value;
    	let t0;
    	let t1;
    	let div0;
    	let current_block_type_index;
    	let if_block1;
    	let div0_class_value;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showClear*/ ctx[11] && create_if_block_6(ctx);
    	const if_block_creators = [create_if_block$3, create_if_block_5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*filteredListItems*/ ctx[17] && /*filteredListItems*/ ctx[17].length > 0) return 0;
    		if (/*noResultsText*/ ctx[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input_1 = element("input");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(input_1, "type", "text");

    			attr_dev(input_1, "class", input_1_class_value = "" + ((/*inputClassName*/ ctx[4]
    			? /*inputClassName*/ ctx[4]
    			: "") + " input autocomplete-input" + " svelte-77usy"));

    			attr_dev(input_1, "id", input_1_id_value = /*inputId*/ ctx[5] ? /*inputId*/ ctx[5] : "");
    			attr_dev(input_1, "autocomplete", input_1_autocomplete_value = /*html5autocomplete*/ ctx[8] ? "on" : "off");
    			attr_dev(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			attr_dev(input_1, "name", /*name*/ ctx[6]);
    			input_1.disabled = /*disabled*/ ctx[12];
    			attr_dev(input_1, "title", /*title*/ ctx[7]);
    			add_location(input_1, file$3, 758, 2, 17476);

    			attr_dev(div0, "class", div0_class_value = "" + ((/*dropdownClassName*/ ctx[9]
    			? /*dropdownClassName*/ ctx[9]
    			: "") + " autocomplete-list " + (/*showList*/ ctx[18] ? "" : "hidden") + "\n    is-fullwidth" + " svelte-77usy"));

    			add_location(div0, file$3, 777, 2, 17997);
    			attr_dev(div1, "class", div1_class_value = "" + ((/*className*/ ctx[3] ? /*className*/ ctx[3] : "") + "\n  " + (/*hideArrow*/ ctx[10] ? "hide-arrow is-multiple" : "") + "\n  " + (/*showClear*/ ctx[11] ? "show-clear" : "") + " autocomplete select is-fullwidth " + /*uniqueId*/ ctx[19] + " svelte-77usy"));
    			add_location(div1, file$3, 754, 0, 17305);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input_1);
    			/*input_1_binding*/ ctx[51](input_1);
    			set_input_value(input_1, /*text*/ ctx[16]);
    			append_dev(div1, t0);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			/*div0_binding*/ ctx[55](div0);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "click", /*onDocumentClick*/ ctx[21], false, false, false),
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[52]),
    					listen_dev(input_1, "input", /*onInput*/ ctx[24], false, false, false),
    					listen_dev(input_1, "focus", /*onFocus*/ ctx[26], false, false, false),
    					listen_dev(input_1, "keydown", /*onKeyDown*/ ctx[22], false, false, false),
    					listen_dev(input_1, "click", /*onInputClick*/ ctx[25], false, false, false),
    					listen_dev(input_1, "keypress", /*onKeyPress*/ ctx[23], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*inputClassName*/ 16 && input_1_class_value !== (input_1_class_value = "" + ((/*inputClassName*/ ctx[4]
    			? /*inputClassName*/ ctx[4]
    			: "") + " input autocomplete-input" + " svelte-77usy"))) {
    				attr_dev(input_1, "class", input_1_class_value);
    			}

    			if (!current || dirty[0] & /*inputId*/ 32 && input_1_id_value !== (input_1_id_value = /*inputId*/ ctx[5] ? /*inputId*/ ctx[5] : "")) {
    				attr_dev(input_1, "id", input_1_id_value);
    			}

    			if (!current || dirty[0] & /*html5autocomplete*/ 256 && input_1_autocomplete_value !== (input_1_autocomplete_value = /*html5autocomplete*/ ctx[8] ? "on" : "off")) {
    				attr_dev(input_1, "autocomplete", input_1_autocomplete_value);
    			}

    			if (!current || dirty[0] & /*placeholder*/ 4) {
    				attr_dev(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*name*/ 64) {
    				attr_dev(input_1, "name", /*name*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*disabled*/ 4096) {
    				prop_dev(input_1, "disabled", /*disabled*/ ctx[12]);
    			}

    			if (!current || dirty[0] & /*title*/ 128) {
    				attr_dev(input_1, "title", /*title*/ ctx[7]);
    			}

    			if (dirty[0] & /*text*/ 65536 && input_1.value !== /*text*/ ctx[16]) {
    				set_input_value(input_1, /*text*/ ctx[16]);
    			}

    			if (/*showClear*/ ctx[11]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (!current || dirty[0] & /*dropdownClassName, showList*/ 262656 && div0_class_value !== (div0_class_value = "" + ((/*dropdownClassName*/ ctx[9]
    			? /*dropdownClassName*/ ctx[9]
    			: "") + " autocomplete-list " + (/*showList*/ ctx[18] ? "" : "hidden") + "\n    is-fullwidth" + " svelte-77usy"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty[0] & /*className, hideArrow, showClear*/ 3080 && div1_class_value !== (div1_class_value = "" + ((/*className*/ ctx[3] ? /*className*/ ctx[3] : "") + "\n  " + (/*hideArrow*/ ctx[10] ? "hide-arrow is-multiple" : "") + "\n  " + (/*showClear*/ ctx[11] ? "show-clear" : "") + " autocomplete select is-fullwidth " + /*uniqueId*/ ctx[19] + " svelte-77usy"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_1_binding*/ ctx[51](null);
    			if (if_block0) if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			/*div0_binding*/ ctx[55](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function safeStringFunction(theFunction, argument) {
    	if (typeof theFunction !== "function") {
    		console.error("Not a function: " + theFunction + ", argument: " + argument);
    	}

    	let originalResult;

    	try {
    		originalResult = theFunction(argument);
    	} catch(error) {
    		console.warn("Error executing Autocomplete function on value: " + argument + " function: " + theFunction);
    	}

    	let result = originalResult;

    	if (result === undefined || result === null) {
    		result = "";
    	}

    	if (typeof result !== "string") {
    		result = result.toString();
    	}

    	return result;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let showList;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SimpleAutocomplete", slots, ['item','no-results']);
    	let { items = [] } = $$props;
    	let { searchFunction = false } = $$props;
    	let { labelFieldName = undefined } = $$props;
    	let { keywordsFieldName = labelFieldName } = $$props;
    	let { valueFieldName = undefined } = $$props;

    	let { labelFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return labelFieldName ? item[labelFieldName] : item;
    	} } = $$props;

    	let { keywordsFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return keywordsFieldName
    		? item[keywordsFieldName]
    		: labelFunction(item);
    	} } = $$props;

    	let { valueFunction = function (item) {
    		if (item === undefined || item === null) {
    			return item;
    		}

    		return valueFieldName ? item[valueFieldName] : item;
    	} } = $$props;

    	let { keywordsCleanFunction = function (keywords) {
    		return keywords;
    	} } = $$props;

    	let { textCleanFunction = function (userEnteredText) {
    		return userEnteredText;
    	} } = $$props;

    	let { beforeChange = function (oldSelectedItem, newSelectedItem) {
    		return true;
    	} } = $$props;

    	let { onChange = function (newSelectedItem) {
    		
    	} } = $$props;

    	let { selectFirstIfEmpty = false } = $$props;
    	let { minCharactersToSearch = 1 } = $$props;
    	let { maxItemsToShowInList = 0 } = $$props;
    	let { delay = 0 } = $$props;
    	let { localFiltering = true } = $$props;
    	let { noResultsText = "No results found" } = $$props;
    	let { placeholder = undefined } = $$props;
    	let { className = undefined } = $$props;
    	let { inputClassName = undefined } = $$props;
    	let { inputId = undefined } = $$props;
    	let { name = undefined } = $$props;
    	let { title = undefined } = $$props;
    	let { html5autocomplete = undefined } = $$props;
    	let { dropdownClassName = undefined } = $$props;
    	let { hideArrow = false } = $$props;
    	let { showClear = false } = $$props;
    	let { disabled = false } = $$props;
    	let { debug = false } = $$props;
    	let { selectedItem = undefined } = $$props;
    	let { value = undefined } = $$props;

    	// --- Internal State ----
    	const uniqueId = "sautocomplete-" + Math.floor(Math.random() * 1000);

    	// HTML elements
    	let input;

    	let list;

    	// UI state
    	let opened = false;

    	let highlightIndex = -1;
    	let text;
    	let filteredTextLength = 0;

    	// view model
    	let filteredListItems;

    	let listItems = [];

    	// other state
    	let inputDelayTimeout;

    	// -- Reactivity --
    	function onSelectedItemChanged() {
    		$$invalidate(30, value = valueFunction(selectedItem));
    		$$invalidate(16, text = safeLabelFunction(selectedItem));
    		onChange(selectedItem);
    	}

    	function safeLabelFunction(item) {
    		// console.log("labelFunction: " + labelFunction);
    		// console.log("safeLabelFunction, item: " + item);
    		return safeStringFunction(labelFunction, item);
    	}

    	function safeKeywordsFunction(item) {
    		// console.log("safeKeywordsFunction");
    		const keywords = safeStringFunction(keywordsFunction, item);

    		let result = safeStringFunction(keywordsCleanFunction, keywords);
    		result = result.toLowerCase().trim();

    		if (debug) {
    			console.log("Extracted keywords: '" + result + "' from item: " + JSON.stringify(item));
    		}

    		return result;
    	}

    	function prepareListItems() {
    		let tStart;

    		if (debug) {
    			tStart = performance.now();
    			console.log("prepare items to search");
    			console.log("items: " + JSON.stringify(items));
    		}

    		if (!Array.isArray(items)) {
    			console.warn("Autocomplete items / search function did not return array but", items);
    			$$invalidate(28, items = []);
    		}

    		const length = items ? items.length : 0;
    		listItems = new Array(length);

    		if (length > 0) {
    			items.forEach((item, i) => {
    				const listItem = getListItem(item);

    				if (listItem == undefined) {
    					console.log("Undefined item for: ", item);
    				}

    				listItems[i] = listItem;
    			});
    		}

    		if (debug) {
    			const tEnd = performance.now();
    			console.log(listItems.length + " items to search prepared in " + (tEnd - tStart) + " milliseconds");
    		}
    	}

    	function getListItem(item) {
    		return {
    			// keywords representation of the item
    			keywords: safeKeywordsFunction(item),
    			// item label
    			label: safeLabelFunction(item),
    			// store reference to the origial item
    			item
    		};
    	}

    	function prepareUserEnteredText(userEnteredText) {
    		if (userEnteredText === undefined || userEnteredText === null) {
    			return "";
    		}

    		const textFiltered = userEnteredText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ").trim();
    		$$invalidate(48, filteredTextLength = textFiltered.length);

    		if (minCharactersToSearch > 1) {
    			if (filteredTextLength < minCharactersToSearch) {
    				return "";
    			}
    		}

    		const cleanUserEnteredText = textCleanFunction(textFiltered);
    		const textFilteredLowerCase = cleanUserEnteredText.toLowerCase().trim();

    		if (debug) {
    			console.log("Change user entered text '" + userEnteredText + "' into '" + textFilteredLowerCase + "'");
    		}

    		return textFilteredLowerCase;
    	}

    	async function search() {
    		let tStart;

    		if (debug) {
    			tStart = performance.now();
    			console.log("Searching user entered text: '" + text + "'");
    		}

    		const textFiltered = prepareUserEnteredText(text);

    		if (textFiltered === "") {
    			$$invalidate(17, filteredListItems = listItems);
    			closeIfMinCharsToSearchReached();

    			if (debug) {
    				console.log("User entered text is empty set the list of items to all items");
    			}

    			return;
    		}

    		// external search which provides items
    		if (searchFunction) {
    			$$invalidate(28, items = await searchFunction(textFiltered));
    			prepareListItems();
    		}

    		// local search
    		let tempfilteredListItems;

    		if (localFiltering) {
    			const searchWords = textFiltered.split(" ");

    			tempfilteredListItems = listItems.filter(listItem => {
    				if (!listItem) {
    					return false;
    				}

    				const itemKeywords = listItem.keywords;
    				let matches = 0;

    				searchWords.forEach(searchWord => {
    					if (itemKeywords.includes(searchWord)) {
    						matches++;
    					}
    				});

    				return matches >= searchWords.length;
    			});
    		} else {
    			tempfilteredListItems = listItems;
    		}

    		const hlfilter = highlightFilter(textFiltered, ["label"]);
    		const filteredListItemsHighlighted = tempfilteredListItems.map(hlfilter);
    		$$invalidate(17, filteredListItems = filteredListItemsHighlighted);
    		closeIfMinCharsToSearchReached();

    		if (debug) {
    			const tEnd = performance.now();
    			console.log("Search took " + (tEnd - tStart) + " milliseconds, found " + filteredListItems.length + " items");
    		}
    	}

    	// $: text, search();
    	function selectListItem(listItem) {
    		if (debug) {
    			console.log("selectListItem");
    		}

    		if ("undefined" === typeof listItem) {
    			if (debug) {
    				console.log(`listItem ${i} is undefined. Can not select.`);
    			}

    			return false;
    		}

    		const newSelectedItem = listItem.item;

    		if (beforeChange(selectedItem, newSelectedItem)) {
    			$$invalidate(29, selectedItem = newSelectedItem);
    		}

    		return true;
    	}

    	function selectItem() {
    		if (debug) {
    			console.log("selectItem");
    		}

    		const listItem = filteredListItems[highlightIndex];

    		if (selectListItem(listItem)) {
    			close();
    		}
    	}

    	function up() {
    		if (debug) {
    			console.log("up");
    		}

    		open();
    		if (highlightIndex > 0) $$invalidate(15, highlightIndex--, highlightIndex);
    		highlight();
    	}

    	function down() {
    		if (debug) {
    			console.log("down");
    		}

    		open();
    		if (highlightIndex < filteredListItems.length - 1) $$invalidate(15, highlightIndex++, highlightIndex);
    		highlight();
    	}

    	function highlight() {
    		if (debug) {
    			console.log("highlight");
    		}

    		const query = ".selected";

    		if (debug) {
    			console.log("Seaching DOM element: " + query + " in " + list);
    		}

    		const el = list && list.querySelector(query);

    		if (el) {
    			if (typeof el.scrollIntoViewIfNeeded === "function") {
    				if (debug) {
    					console.log("Scrolling selected item into view");
    				}

    				el.scrollIntoViewIfNeeded();
    			} else {
    				if (debug) {
    					console.warn("Could not scroll selected item into view, scrollIntoViewIfNeeded not supported");
    				}
    			}
    		} else {
    			if (debug) {
    				console.warn("Selected item not found to scroll into view");
    			}
    		}
    	}

    	function onListItemClick(listItem) {
    		if (debug) {
    			console.log("onListItemClick");
    		}

    		if (selectListItem(listItem)) {
    			close();
    		}
    	}

    	function onDocumentClick(e) {
    		if (debug) {
    			console.log("onDocumentClick: " + JSON.stringify(e.target));
    		}

    		if (e.target.closest("." + uniqueId)) {
    			if (debug) {
    				console.log("onDocumentClick inside");
    			}

    			// resetListToAllItemsAndOpen();
    			highlight();
    		} else {
    			if (debug) {
    				console.log("onDocumentClick outside");
    			}

    			close();
    		}
    	}

    	function onKeyDown(e) {
    		if (debug) {
    			console.log("onKeyDown");
    		}

    		let key = e.key;
    		if (key === "Tab" && e.shiftKey) key = "ShiftTab";

    		const fnmap = {
    			Tab: opened ? down.bind(this) : null,
    			ShiftTab: opened ? up.bind(this) : null,
    			ArrowDown: down.bind(this),
    			ArrowUp: up.bind(this),
    			Escape: onEsc.bind(this)
    		};

    		const fn = fnmap[key];

    		if (typeof fn === "function") {
    			e.preventDefault();
    			fn(e);
    		}
    	}

    	function onKeyPress(e) {
    		if (debug) {
    			console.log("onKeyPress");
    		}

    		if (e.key === "Enter") {
    			e.preventDefault();
    			selectItem();
    		}
    	}

    	function onInput(e) {
    		if (debug) {
    			console.log("onInput");
    		}

    		$$invalidate(16, text = e.target.value);

    		if (inputDelayTimeout) {
    			clearTimeout(inputDelayTimeout);
    		}

    		if (delay) {
    			inputDelayTimeout = setTimeout(processInput, delay);
    		} else {
    			processInput();
    		}
    	}

    	function processInput() {
    		search();
    		$$invalidate(15, highlightIndex = 0);
    		open();
    	}

    	function onInputClick() {
    		if (debug) {
    			console.log("onInputClick");
    		}

    		resetListToAllItemsAndOpen();
    	}

    	function onEsc(e) {
    		if (debug) {
    			console.log("onEsc");
    		}

    		//if (text) return clear();
    		e.stopPropagation();

    		if (opened) {
    			input.focus();
    			close();
    		}
    	}

    	function onFocus() {
    		if (debug) {
    			console.log("onFocus");
    		}

    		resetListToAllItemsAndOpen();
    	}

    	function resetListToAllItemsAndOpen() {
    		if (debug) {
    			console.log("resetListToAllItemsAndOpen");
    		}

    		$$invalidate(17, filteredListItems = listItems);
    		open();

    		// find selected item
    		if (selectedItem) {
    			if (debug) {
    				console.log("Searching currently selected item: " + JSON.stringify(selectedItem));
    			}

    			for (let i = 0; i < listItems.length; i++) {
    				const listItem = listItems[i];

    				if ("undefined" === typeof listItem) {
    					if (debug) {
    						console.log(`listItem ${i} is undefined. Skipping.`);
    					}

    					continue;
    				}

    				if (debug) {
    					console.log("Item " + i + ": " + JSON.stringify(listItem));
    				}

    				if (selectedItem == listItem.item) {
    					$$invalidate(15, highlightIndex = i);

    					if (debug) {
    						console.log("Found selected item: " + i + ": " + JSON.stringify(listItem));
    					}

    					highlight();
    					break;
    				}
    			}
    		}
    	}

    	function open() {
    		if (debug) {
    			console.log("open");
    		}

    		// check if the search text has more than the min chars required
    		if (isMinCharsToSearchReached()) {
    			return;
    		}

    		$$invalidate(47, opened = true);
    	}

    	function close() {
    		if (debug) {
    			console.log("close");
    		}

    		$$invalidate(47, opened = false);

    		if (!text && selectFirstIfEmpty) {
    			highlightFilter = 0;
    			selectItem();
    		}
    	}

    	function isMinCharsToSearchReached() {
    		return minCharactersToSearch > 1 && filteredTextLength < minCharactersToSearch;
    	}

    	function closeIfMinCharsToSearchReached() {
    		if (isMinCharsToSearchReached()) {
    			close();
    		}
    	}

    	function clear() {
    		if (debug) {
    			console.log("clear");
    		}

    		$$invalidate(16, text = "");
    		$$invalidate(29, selectedItem = undefined);

    		setTimeout(() => {
    			input.focus();
    			close();
    		});
    	}

    	function onBlur() {
    		if (debug) {
    			console.log("onBlur");
    		}

    		close();
    	}

    	// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
    	function highlightFilter(q, fields) {
    		const qs = "(" + q.trim().replace(/\s/g, ")(.*)(") + ")";
    		const reg = new RegExp(qs, "ig");
    		let n = 1;
    		const len = qs.split(")(").length + 1;
    		let repl = "";
    		for (; n < len; n++) repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;

    		return i => {
    			const newI = Object.assign({ highlighted: {} }, i);

    			if (fields) {
    				fields.forEach(f => {
    					if (!newI[f]) return;
    					newI.highlighted[f] = newI[f].replace(reg, repl);
    				});
    			}

    			return newI;
    		};
    	}

    	const writable_props = [
    		"items",
    		"searchFunction",
    		"labelFieldName",
    		"keywordsFieldName",
    		"valueFieldName",
    		"labelFunction",
    		"keywordsFunction",
    		"valueFunction",
    		"keywordsCleanFunction",
    		"textCleanFunction",
    		"beforeChange",
    		"onChange",
    		"selectFirstIfEmpty",
    		"minCharactersToSearch",
    		"maxItemsToShowInList",
    		"delay",
    		"localFiltering",
    		"noResultsText",
    		"placeholder",
    		"className",
    		"inputClassName",
    		"inputId",
    		"name",
    		"title",
    		"html5autocomplete",
    		"dropdownClassName",
    		"hideArrow",
    		"showClear",
    		"disabled",
    		"debug",
    		"selectedItem",
    		"value"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<SimpleAutocomplete> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler() {
    		text = this.value;
    		$$invalidate(16, text);
    	}

    	const click_handler = listItem => onListItemClick(listItem);

    	const pointerenter_handler = i => {
    		$$invalidate(15, highlightIndex = i);
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			list = $$value;
    			$$invalidate(14, list);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(28, items = $$props.items);
    		if ("searchFunction" in $$props) $$invalidate(31, searchFunction = $$props.searchFunction);
    		if ("labelFieldName" in $$props) $$invalidate(32, labelFieldName = $$props.labelFieldName);
    		if ("keywordsFieldName" in $$props) $$invalidate(33, keywordsFieldName = $$props.keywordsFieldName);
    		if ("valueFieldName" in $$props) $$invalidate(34, valueFieldName = $$props.valueFieldName);
    		if ("labelFunction" in $$props) $$invalidate(35, labelFunction = $$props.labelFunction);
    		if ("keywordsFunction" in $$props) $$invalidate(36, keywordsFunction = $$props.keywordsFunction);
    		if ("valueFunction" in $$props) $$invalidate(37, valueFunction = $$props.valueFunction);
    		if ("keywordsCleanFunction" in $$props) $$invalidate(38, keywordsCleanFunction = $$props.keywordsCleanFunction);
    		if ("textCleanFunction" in $$props) $$invalidate(39, textCleanFunction = $$props.textCleanFunction);
    		if ("beforeChange" in $$props) $$invalidate(40, beforeChange = $$props.beforeChange);
    		if ("onChange" in $$props) $$invalidate(41, onChange = $$props.onChange);
    		if ("selectFirstIfEmpty" in $$props) $$invalidate(42, selectFirstIfEmpty = $$props.selectFirstIfEmpty);
    		if ("minCharactersToSearch" in $$props) $$invalidate(43, minCharactersToSearch = $$props.minCharactersToSearch);
    		if ("maxItemsToShowInList" in $$props) $$invalidate(0, maxItemsToShowInList = $$props.maxItemsToShowInList);
    		if ("delay" in $$props) $$invalidate(44, delay = $$props.delay);
    		if ("localFiltering" in $$props) $$invalidate(45, localFiltering = $$props.localFiltering);
    		if ("noResultsText" in $$props) $$invalidate(1, noResultsText = $$props.noResultsText);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("className" in $$props) $$invalidate(3, className = $$props.className);
    		if ("inputClassName" in $$props) $$invalidate(4, inputClassName = $$props.inputClassName);
    		if ("inputId" in $$props) $$invalidate(5, inputId = $$props.inputId);
    		if ("name" in $$props) $$invalidate(6, name = $$props.name);
    		if ("title" in $$props) $$invalidate(7, title = $$props.title);
    		if ("html5autocomplete" in $$props) $$invalidate(8, html5autocomplete = $$props.html5autocomplete);
    		if ("dropdownClassName" in $$props) $$invalidate(9, dropdownClassName = $$props.dropdownClassName);
    		if ("hideArrow" in $$props) $$invalidate(10, hideArrow = $$props.hideArrow);
    		if ("showClear" in $$props) $$invalidate(11, showClear = $$props.showClear);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$props.disabled);
    		if ("debug" in $$props) $$invalidate(46, debug = $$props.debug);
    		if ("selectedItem" in $$props) $$invalidate(29, selectedItem = $$props.selectedItem);
    		if ("value" in $$props) $$invalidate(30, value = $$props.value);
    		if ("$$scope" in $$props) $$invalidate(49, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		items,
    		searchFunction,
    		labelFieldName,
    		keywordsFieldName,
    		valueFieldName,
    		labelFunction,
    		keywordsFunction,
    		valueFunction,
    		keywordsCleanFunction,
    		textCleanFunction,
    		beforeChange,
    		onChange,
    		selectFirstIfEmpty,
    		minCharactersToSearch,
    		maxItemsToShowInList,
    		delay,
    		localFiltering,
    		noResultsText,
    		placeholder,
    		className,
    		inputClassName,
    		inputId,
    		name,
    		title,
    		html5autocomplete,
    		dropdownClassName,
    		hideArrow,
    		showClear,
    		disabled,
    		debug,
    		selectedItem,
    		value,
    		uniqueId,
    		input,
    		list,
    		opened,
    		highlightIndex,
    		text,
    		filteredTextLength,
    		filteredListItems,
    		listItems,
    		inputDelayTimeout,
    		onSelectedItemChanged,
    		safeStringFunction,
    		safeLabelFunction,
    		safeKeywordsFunction,
    		prepareListItems,
    		getListItem,
    		prepareUserEnteredText,
    		search,
    		selectListItem,
    		selectItem,
    		up,
    		down,
    		highlight,
    		onListItemClick,
    		onDocumentClick,
    		onKeyDown,
    		onKeyPress,
    		onInput,
    		processInput,
    		onInputClick,
    		onEsc,
    		onFocus,
    		resetListToAllItemsAndOpen,
    		open,
    		close,
    		isMinCharsToSearchReached,
    		closeIfMinCharsToSearchReached,
    		clear,
    		onBlur,
    		highlightFilter,
    		showList
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(28, items = $$props.items);
    		if ("searchFunction" in $$props) $$invalidate(31, searchFunction = $$props.searchFunction);
    		if ("labelFieldName" in $$props) $$invalidate(32, labelFieldName = $$props.labelFieldName);
    		if ("keywordsFieldName" in $$props) $$invalidate(33, keywordsFieldName = $$props.keywordsFieldName);
    		if ("valueFieldName" in $$props) $$invalidate(34, valueFieldName = $$props.valueFieldName);
    		if ("labelFunction" in $$props) $$invalidate(35, labelFunction = $$props.labelFunction);
    		if ("keywordsFunction" in $$props) $$invalidate(36, keywordsFunction = $$props.keywordsFunction);
    		if ("valueFunction" in $$props) $$invalidate(37, valueFunction = $$props.valueFunction);
    		if ("keywordsCleanFunction" in $$props) $$invalidate(38, keywordsCleanFunction = $$props.keywordsCleanFunction);
    		if ("textCleanFunction" in $$props) $$invalidate(39, textCleanFunction = $$props.textCleanFunction);
    		if ("beforeChange" in $$props) $$invalidate(40, beforeChange = $$props.beforeChange);
    		if ("onChange" in $$props) $$invalidate(41, onChange = $$props.onChange);
    		if ("selectFirstIfEmpty" in $$props) $$invalidate(42, selectFirstIfEmpty = $$props.selectFirstIfEmpty);
    		if ("minCharactersToSearch" in $$props) $$invalidate(43, minCharactersToSearch = $$props.minCharactersToSearch);
    		if ("maxItemsToShowInList" in $$props) $$invalidate(0, maxItemsToShowInList = $$props.maxItemsToShowInList);
    		if ("delay" in $$props) $$invalidate(44, delay = $$props.delay);
    		if ("localFiltering" in $$props) $$invalidate(45, localFiltering = $$props.localFiltering);
    		if ("noResultsText" in $$props) $$invalidate(1, noResultsText = $$props.noResultsText);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("className" in $$props) $$invalidate(3, className = $$props.className);
    		if ("inputClassName" in $$props) $$invalidate(4, inputClassName = $$props.inputClassName);
    		if ("inputId" in $$props) $$invalidate(5, inputId = $$props.inputId);
    		if ("name" in $$props) $$invalidate(6, name = $$props.name);
    		if ("title" in $$props) $$invalidate(7, title = $$props.title);
    		if ("html5autocomplete" in $$props) $$invalidate(8, html5autocomplete = $$props.html5autocomplete);
    		if ("dropdownClassName" in $$props) $$invalidate(9, dropdownClassName = $$props.dropdownClassName);
    		if ("hideArrow" in $$props) $$invalidate(10, hideArrow = $$props.hideArrow);
    		if ("showClear" in $$props) $$invalidate(11, showClear = $$props.showClear);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$props.disabled);
    		if ("debug" in $$props) $$invalidate(46, debug = $$props.debug);
    		if ("selectedItem" in $$props) $$invalidate(29, selectedItem = $$props.selectedItem);
    		if ("value" in $$props) $$invalidate(30, value = $$props.value);
    		if ("input" in $$props) $$invalidate(13, input = $$props.input);
    		if ("list" in $$props) $$invalidate(14, list = $$props.list);
    		if ("opened" in $$props) $$invalidate(47, opened = $$props.opened);
    		if ("highlightIndex" in $$props) $$invalidate(15, highlightIndex = $$props.highlightIndex);
    		if ("text" in $$props) $$invalidate(16, text = $$props.text);
    		if ("filteredTextLength" in $$props) $$invalidate(48, filteredTextLength = $$props.filteredTextLength);
    		if ("filteredListItems" in $$props) $$invalidate(17, filteredListItems = $$props.filteredListItems);
    		if ("listItems" in $$props) listItems = $$props.listItems;
    		if ("inputDelayTimeout" in $$props) inputDelayTimeout = $$props.inputDelayTimeout;
    		if ("showList" in $$props) $$invalidate(18, showList = $$props.showList);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*selectedItem*/ 536870912) {
    			(onSelectedItemChanged());
    		}

    		if ($$self.$$.dirty[0] & /*items*/ 268435456 | $$self.$$.dirty[1] & /*opened, filteredTextLength*/ 196608) {
    			$$invalidate(18, showList = opened && (items && items.length > 0 || filteredTextLength > 0));
    		}

    		if ($$self.$$.dirty[0] & /*items*/ 268435456) {
    			(prepareListItems());
    		}
    	};

    	return [
    		maxItemsToShowInList,
    		noResultsText,
    		placeholder,
    		className,
    		inputClassName,
    		inputId,
    		name,
    		title,
    		html5autocomplete,
    		dropdownClassName,
    		hideArrow,
    		showClear,
    		disabled,
    		input,
    		list,
    		highlightIndex,
    		text,
    		filteredListItems,
    		showList,
    		uniqueId,
    		onListItemClick,
    		onDocumentClick,
    		onKeyDown,
    		onKeyPress,
    		onInput,
    		onInputClick,
    		onFocus,
    		clear,
    		items,
    		selectedItem,
    		value,
    		searchFunction,
    		labelFieldName,
    		keywordsFieldName,
    		valueFieldName,
    		labelFunction,
    		keywordsFunction,
    		valueFunction,
    		keywordsCleanFunction,
    		textCleanFunction,
    		beforeChange,
    		onChange,
    		selectFirstIfEmpty,
    		minCharactersToSearch,
    		delay,
    		localFiltering,
    		debug,
    		opened,
    		filteredTextLength,
    		$$scope,
    		slots,
    		input_1_binding,
    		input_1_input_handler,
    		click_handler,
    		pointerenter_handler,
    		div0_binding
    	];
    }

    class SimpleAutocomplete extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				items: 28,
    				searchFunction: 31,
    				labelFieldName: 32,
    				keywordsFieldName: 33,
    				valueFieldName: 34,
    				labelFunction: 35,
    				keywordsFunction: 36,
    				valueFunction: 37,
    				keywordsCleanFunction: 38,
    				textCleanFunction: 39,
    				beforeChange: 40,
    				onChange: 41,
    				selectFirstIfEmpty: 42,
    				minCharactersToSearch: 43,
    				maxItemsToShowInList: 0,
    				delay: 44,
    				localFiltering: 45,
    				noResultsText: 1,
    				placeholder: 2,
    				className: 3,
    				inputClassName: 4,
    				inputId: 5,
    				name: 6,
    				title: 7,
    				html5autocomplete: 8,
    				dropdownClassName: 9,
    				hideArrow: 10,
    				showClear: 11,
    				disabled: 12,
    				debug: 46,
    				selectedItem: 29,
    				value: 30
    			},
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SimpleAutocomplete",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get items() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get searchFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set searchFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelFieldName() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelFieldName(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keywordsFieldName() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keywordsFieldName(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueFieldName() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueFieldName(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keywordsFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keywordsFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keywordsCleanFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keywordsCleanFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textCleanFunction() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textCleanFunction(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get beforeChange() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set beforeChange(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectFirstIfEmpty() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectFirstIfEmpty(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minCharactersToSearch() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minCharactersToSearch(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxItemsToShowInList() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxItemsToShowInList(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get localFiltering() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set localFiltering(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noResultsText() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noResultsText(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputClassName() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputClassName(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputId() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputId(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get html5autocomplete() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set html5autocomplete(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dropdownClassName() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dropdownClassName(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideArrow() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideArrow(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showClear() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showClear(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get debug() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set debug(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedItem() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedItem(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<SimpleAutocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<SimpleAutocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\saos\src\Saos.svelte generated by Svelte v3.38.2 */
    const file$2 = "node_modules\\saos\\src\\Saos.svelte";

    // (75:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$2, 75, 4, 2229);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*animation_out, css_animation*/ 10 && div_style_value !== (div_style_value = "animation: " + /*animation_out*/ ctx[1] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (71:2) {#if observing}
    function create_if_block$2(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3]);
    			add_location(div, file$2, 71, 4, 2135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*animation, css_animation*/ 9 && div_style_value !== (div_style_value = "animation: " + /*animation*/ ctx[0] + "; " + /*css_animation*/ ctx[3])) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(71:2) {#if observing}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*observing*/ ctx[4]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "id", /*countainer*/ ctx[5]);
    			attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			add_location(div, file$2, 69, 0, 2070);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}

    			if (!current || dirty & /*css_observer*/ 4) {
    				attr_dev(div, "style", /*css_observer*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Saos", slots, ['default']);
    	let { animation = "none" } = $$props;
    	let { animation_out = "none; opacity: 0" } = $$props;
    	let { once = false } = $$props;
    	let { top = 0 } = $$props;
    	let { bottom = 0 } = $$props;
    	let { css_observer = "" } = $$props;
    	let { css_animation = "" } = $$props;

    	// cute litle reactive dispatch to get if is observing :3
    	const dispatch = createEventDispatcher();

    	// be aware... he's looking...
    	let observing = true;

    	// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    	const countainer = `__saos-${Math.random()}__`;

    	/// current in experimental support, no support for IE (only Edge)
    	/// see more in: https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
    	function intersection_verify(box) {
    		// bottom left top right
    		const rootMargin = `${-bottom}px 0px ${-top}px 0px`;

    		const observer = new IntersectionObserver(entries => {
    				$$invalidate(4, observing = entries[0].isIntersecting);

    				if (observing && once) {
    					observer.unobserve(box);
    				}
    			},
    		{ rootMargin });

    		observer.observe(box);
    		return () => observer.unobserve(box);
    	}

    	/// Fallback in case the browser not have the IntersectionObserver
    	function bounding_verify(box) {
    		const c = box.getBoundingClientRect();
    		$$invalidate(4, observing = c.top + top < window.innerHeight && c.bottom - bottom > 0);

    		if (observing && once) {
    			window.removeEventListener("scroll", verify);
    		}

    		window.addEventListener("scroll", bounding_verify);
    		return () => window.removeEventListener("scroll", bounding_verify);
    	}

    	onMount(() => {
    		// for some reason the 'bind:this={box}' on div stops working after npm run build... so... workaround time >:|
    		const box = document.getElementById(countainer);

    		if (IntersectionObserver) {
    			return intersection_verify(box);
    		} else {
    			return bounding_verify(box);
    		}
    	});

    	const writable_props = [
    		"animation",
    		"animation_out",
    		"once",
    		"top",
    		"bottom",
    		"css_observer",
    		"css_animation"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Saos> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("animation_out" in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ("once" in $$props) $$invalidate(6, once = $$props.once);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ("css_observer" in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ("css_animation" in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		animation,
    		animation_out,
    		once,
    		top,
    		bottom,
    		css_observer,
    		css_animation,
    		dispatch,
    		observing,
    		countainer,
    		intersection_verify,
    		bounding_verify
    	});

    	$$self.$inject_state = $$props => {
    		if ("animation" in $$props) $$invalidate(0, animation = $$props.animation);
    		if ("animation_out" in $$props) $$invalidate(1, animation_out = $$props.animation_out);
    		if ("once" in $$props) $$invalidate(6, once = $$props.once);
    		if ("top" in $$props) $$invalidate(7, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(8, bottom = $$props.bottom);
    		if ("css_observer" in $$props) $$invalidate(2, css_observer = $$props.css_observer);
    		if ("css_animation" in $$props) $$invalidate(3, css_animation = $$props.css_animation);
    		if ("observing" in $$props) $$invalidate(4, observing = $$props.observing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*observing*/ 16) {
    			dispatch("update", { observing });
    		}
    	};

    	return [
    		animation,
    		animation_out,
    		css_observer,
    		css_animation,
    		observing,
    		countainer,
    		once,
    		top,
    		bottom,
    		$$scope,
    		slots
    	];
    }

    class Saos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			animation: 0,
    			animation_out: 1,
    			once: 6,
    			top: 7,
    			bottom: 8,
    			css_observer: 2,
    			css_animation: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Saos",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation_out() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation_out(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get once() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set once(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_observer() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_observer(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css_animation() {
    		throw new Error("<Saos>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css_animation(value) {
    		throw new Error("<Saos>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const fav = writable([]);

    const localFav = localStorage.getItem("fav");
    if (localFav) {
        try {
            const parsed = JSON.parse(localFav);
            if (parsed.constructor === Array) {
                fav.set(parsed);
            }
        }
        catch (e) {

        }
    }

    /* src\City.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file$1 = "src\\City.svelte";

    // (56:2) {#if mapurl}
    function create_if_block$1(ctx) {
    	let div;
    	let saos;
    	let t;
    	let img;
    	let img_src_value;
    	let current;

    	saos = new Saos({
    			props: {
    				animation: "puff-in-center 0.7s cubic-bezier(0.470, 0.000, 0.745, 0.715) both",
    				animation_out: "slide-out-elliptic-top-bck 0.7s ease-in both",
    				top: 250,
    				bottom: 250,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(saos.$$.fragment);
    			t = space();
    			img = element("img");
    			if (img.src !== (img_src_value = /*mapurl*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "mapImageView");
    			add_location(img, file$1, 87, 6, 2928);
    			attr_dev(div, "class", "container svelte-17ml1l7");
    			add_location(div, file$1, 56, 4, 1824);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(saos, div, null);
    			append_dev(div, t);
    			append_dev(div, img);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const saos_changes = {};

    			if (dirty & /*$$scope, fav_value, city, humidity, temp_max, temp_min, feels_like, temp, icon*/ 16863) {
    				saos_changes.$$scope = { dirty, ctx };
    			}

    			saos.$set(saos_changes);

    			if (!current || dirty & /*mapurl*/ 32 && img.src !== (img_src_value = /*mapurl*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(saos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(saos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(saos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(56:2) {#if mapurl}",
    		ctx
    	});

    	return block;
    }

    // (65:10) {#if icon}
    function create_if_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*icon*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "icon");
    			add_location(img, file$1, 65, 12, 2143);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 256 && img.src !== (img_src_value = /*icon*/ ctx[8])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(65:10) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (74:10) {#if fav_value.includes(city) === false}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Ajouter aux favoris";
    			add_location(p, file$1, 74, 10, 2556);
    			attr_dev(button, "class", "button");
    			add_location(button, file$1, 75, 12, 2577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(74:10) {#if fav_value.includes(city) === false}",
    		ctx
    	});

    	return block;
    }

    // (58:6) <Saos          animation={"puff-in-center 0.7s cubic-bezier(0.470, 0.000, 0.745, 0.715) both"}          animation_out={"slide-out-elliptic-top-bck 0.7s ease-in both"}          top={250}          bottom={250}        >
    function create_default_slot(ctx) {
    	let div6;
    	let t0;
    	let div0;
    	let t1;
    	let b;
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let div2;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let div3;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let div4;
    	let t16;
    	let t17;
    	let t18;
    	let t19;
    	let div5;
    	let t20;
    	let t21;
    	let t22;
    	let t23;
    	let show_if = /*fav_value*/ ctx[1].includes(/*city*/ ctx[0]) === false;
    	let if_block0 = /*icon*/ ctx[8] && create_if_block_2(ctx);
    	let if_block1 = show_if && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = text("Ville : ");
    			b = element("b");
    			t2 = text(/*city*/ ctx[0]);
    			t3 = space();
    			div1 = element("div");
    			t4 = text("Température : ");
    			t5 = text(/*temp*/ ctx[3]);
    			t6 = text(" °C");
    			t7 = space();
    			div2 = element("div");
    			t8 = text("Température ressentie: ");
    			t9 = text(/*feels_like*/ ctx[2]);
    			t10 = text(" °C");
    			t11 = space();
    			div3 = element("div");
    			t12 = text("Température min: ");
    			t13 = text(/*temp_min*/ ctx[7]);
    			t14 = text(" °C");
    			t15 = space();
    			div4 = element("div");
    			t16 = text("Température max: ");
    			t17 = text(/*temp_max*/ ctx[6]);
    			t18 = text(" °C");
    			t19 = space();
    			div5 = element("div");
    			t20 = text("Humidité : ");
    			t21 = text(/*humidity*/ ctx[4]);
    			t22 = text(" %");
    			t23 = space();
    			if (if_block1) if_block1.c();
    			add_location(b, file$1, 67, 23, 2214);
    			add_location(div0, file$1, 67, 10, 2201);
    			add_location(div1, file$1, 68, 10, 2245);
    			add_location(div2, file$1, 69, 10, 2291);
    			add_location(div3, file$1, 70, 10, 2352);
    			add_location(div4, file$1, 71, 10, 2405);
    			add_location(div5, file$1, 72, 10, 2458);
    			attr_dev(div6, "class", "subcontainer svelte-17ml1l7");
    			add_location(div6, file$1, 63, 8, 2081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			if (if_block0) if_block0.m(div6, null);
    			append_dev(div6, t0);
    			append_dev(div6, div0);
    			append_dev(div0, t1);
    			append_dev(div0, b);
    			append_dev(b, t2);
    			append_dev(div6, t3);
    			append_dev(div6, div1);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, t6);
    			append_dev(div6, t7);
    			append_dev(div6, div2);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    			append_dev(div6, t11);
    			append_dev(div6, div3);
    			append_dev(div3, t12);
    			append_dev(div3, t13);
    			append_dev(div3, t14);
    			append_dev(div6, t15);
    			append_dev(div6, div4);
    			append_dev(div4, t16);
    			append_dev(div4, t17);
    			append_dev(div4, t18);
    			append_dev(div6, t19);
    			append_dev(div6, div5);
    			append_dev(div5, t20);
    			append_dev(div5, t21);
    			append_dev(div5, t22);
    			append_dev(div6, t23);
    			if (if_block1) if_block1.m(div6, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[8]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div6, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*city*/ 1) set_data_dev(t2, /*city*/ ctx[0]);
    			if (dirty & /*temp*/ 8) set_data_dev(t5, /*temp*/ ctx[3]);
    			if (dirty & /*feels_like*/ 4) set_data_dev(t9, /*feels_like*/ ctx[2]);
    			if (dirty & /*temp_min*/ 128) set_data_dev(t13, /*temp_min*/ ctx[7]);
    			if (dirty & /*temp_max*/ 64) set_data_dev(t17, /*temp_max*/ ctx[6]);
    			if (dirty & /*humidity*/ 16) set_data_dev(t21, /*humidity*/ ctx[4]);
    			if (dirty & /*fav_value, city*/ 3) show_if = /*fav_value*/ ctx[1].includes(/*city*/ ctx[0]) === false;

    			if (show_if) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div6, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(58:6) <Saos          animation={\\\"puff-in-center 0.7s cubic-bezier(0.470, 0.000, 0.745, 0.715) both\\\"}          animation_out={\\\"slide-out-elliptic-top-bck 0.7s ease-in both\\\"}          top={250}          bottom={250}        >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	let if_block = /*mapurl*/ ctx[5] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			add_location(div, file$1, 54, 0, 1797);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*mapurl*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mapurl*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const appid_openweather = "de20cef7b5f680d7f00c7ecf69c4b2a2"; //openweathermap appid
    const appcode_heremaps = "xd8J-saYa0g3xYKJVln__jTCRCsRUwZGo9-qa2VYte8"; //here maps app code

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("City", slots, []);
    	let fav_value = [];

    	fav.subscribe(value => {
    		$$invalidate(1, fav_value = value);
    	});

    	var loading = false; //get loading state varialble
    	var feels_like, temp, humidity, disc, mapurl, temp_max, temp_min = ""; //store input value varialble1
    	var incomeData = null; //varialble for openweathermap data
    	let icon;
    	let { city } = $$props;

    	async function submitHandler() {
    		$$invalidate(5, mapurl = "");
    		$$invalidate(8, icon = "");
    		if (!city) return;

    		//submit handler function
    		loading = true; //chage loading state to true

    		const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${appid_openweather}&units=metric`);
    		let data = await response.json();

    		//get data upone a sucsessfull response
    		loading = false; //chage loading state to false

    		console.log(data.data);
    		incomeData = data; //assign response data to the variable
    		$$invalidate(3, temp = incomeData.main.temp);
    		$$invalidate(7, temp_min = incomeData.main.temp_min);
    		$$invalidate(6, temp_max = incomeData.main.temp_max);
    		$$invalidate(2, feels_like = incomeData.main.feels_like);
    		$$invalidate(4, humidity = incomeData.main.humidity);
    		disc = incomeData.weather[0];
    		$$invalidate(8, icon = "http://openweathermap.org/img/wn/" + disc.icon + "@2x.png");

    		$$invalidate(5, mapurl = `https://image.maps.ls.hereapi.com/mia/1.6/mapview?apiKey=${appcode_heremaps}&c=${incomeData.coord.lat},${incomeData.coord.lon}&t=0&z=12&w=250
  &h=250`); //set the url to of the map image
    	}

    	const writable_props = ["city"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<City> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		fav_value.push(city);
    		fav.set(fav_value);
    		localStorage.setItem("fav", JSON.stringify(fav_value));
    	};

    	$$self.$$set = $$props => {
    		if ("city" in $$props) $$invalidate(0, city = $$props.city);
    	};

    	$$self.$capture_state = () => ({
    		Saos,
    		fav,
    		fav_value,
    		appid_openweather,
    		appcode_heremaps,
    		loading,
    		feels_like,
    		temp,
    		humidity,
    		disc,
    		mapurl,
    		temp_max,
    		temp_min,
    		incomeData,
    		icon,
    		city,
    		submitHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("fav_value" in $$props) $$invalidate(1, fav_value = $$props.fav_value);
    		if ("loading" in $$props) loading = $$props.loading;
    		if ("feels_like" in $$props) $$invalidate(2, feels_like = $$props.feels_like);
    		if ("temp" in $$props) $$invalidate(3, temp = $$props.temp);
    		if ("humidity" in $$props) $$invalidate(4, humidity = $$props.humidity);
    		if ("disc" in $$props) disc = $$props.disc;
    		if ("mapurl" in $$props) $$invalidate(5, mapurl = $$props.mapurl);
    		if ("temp_max" in $$props) $$invalidate(6, temp_max = $$props.temp_max);
    		if ("temp_min" in $$props) $$invalidate(7, temp_min = $$props.temp_min);
    		if ("incomeData" in $$props) incomeData = $$props.incomeData;
    		if ("icon" in $$props) $$invalidate(8, icon = $$props.icon);
    		if ("city" in $$props) $$invalidate(0, city = $$props.city);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*city*/ 1) {
    			{
    				console.log("color city", city);
    				submitHandler();
    			}
    		}
    	};

    	return [
    		city,
    		fav_value,
    		feels_like,
    		temp,
    		humidity,
    		mapurl,
    		temp_max,
    		temp_min,
    		icon,
    		click_handler
    	];
    }

    class City extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { city: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "City",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*city*/ ctx[0] === undefined && !("city" in props)) {
    			console_1.warn("<City> was created without expected prop 'city'");
    		}
    	}

    	get city() {
    		throw new Error("<City>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set city(value) {
    		throw new Error("<City>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (63:4) {#if fav_value.length > 0}
    function create_if_block_1(ctx) {
    	let t;
    	let p;

    	const block = {
    		c: function create() {
    			t = text("Météo des villes favorites\r\n      ");
    			p = element("p");
    			add_location(p, file, 64, 6, 1822);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(63:4) {#if fav_value.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#each fav_value as f}
    function create_each_block(ctx) {
    	let city_1;
    	let t;
    	let br;
    	let current;

    	city_1 = new City({
    			props: { city: /*f*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(city_1.$$.fragment);
    			t = space();
    			br = element("br");
    			add_location(br, file, 70, 6, 1913);
    		},
    		m: function mount(target, anchor) {
    			mount_component(city_1, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const city_1_changes = {};
    			if (dirty & /*fav_value*/ 4) city_1_changes.city = /*f*/ ctx[7];
    			city_1.$set(city_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(city_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(city_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(city_1, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(69:4) {#each fav_value as f}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#if fav_value.length > 0}
    function create_if_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "vider les favoris";
    			attr_dev(button, "class", "button");
    			add_location(button, file, 73, 6, 1972);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(73:4) {#if fav_value.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let p;
    	let t2;
    	let form;
    	let autocomplete;
    	let updating_selectedItem;
    	let t3;
    	let div3;
    	let br0;
    	let t4;
    	let city_1;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let br2;
    	let t8;
    	let t9;
    	let current;

    	function autocomplete_selectedItem_binding(value) {
    		/*autocomplete_selectedItem_binding*/ ctx[4](value);
    	}

    	let autocomplete_props = {
    		className: "search__input",
    		searchFunction: searchCountry,
    		valueFunction: /*submitHandler*/ ctx[3],
    		html5autocomplete: false,
    		showClear: true,
    		noResultsText: "Aucun résultat",
    		labelFieldName: "city",
    		maxItemsToShowInList: "10",
    		delay: "200",
    		hideArrow: true,
    		localFiltering: "false",
    		placeholder: "Rechercher"
    	};

    	if (/*selectedCountry*/ ctx[0] !== void 0) {
    		autocomplete_props.selectedItem = /*selectedCountry*/ ctx[0];
    	}

    	autocomplete = new SimpleAutocomplete({
    			props: autocomplete_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(autocomplete, "selectedItem", autocomplete_selectedItem_binding));

    	city_1 = new City({
    			props: {
    				city: /*city*/ ctx[1],
    				fav_value: /*fav_value*/ ctx[2]
    			},
    			$$inline: true
    		});

    	let if_block0 = /*fav_value*/ ctx[2].length > 0 && create_if_block_1(ctx);
    	let each_value = /*fav_value*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*fav_value*/ ctx[2].length > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Votre météo du jour en un clic !";
    			t2 = space();
    			form = element("form");
    			create_component(autocomplete.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			br0 = element("br");
    			t4 = space();
    			create_component(city_1.$$.fragment);
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			if (if_block0) if_block0.c();
    			t7 = space();
    			br2 = element("br");
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			if (if_block1) if_block1.c();
    			add_location(div0, file, 34, 2, 968);
    			attr_dev(p, "class", "search__title");
    			add_location(p, file, 37, 6, 1029);
    			attr_dev(form, "autocomplete", "off");
    			add_location(form, file, 38, 6, 1098);
    			attr_dev(div1, "class", "search__container svelte-10359b1");
    			add_location(div1, file, 36, 4, 990);
    			add_location(div2, file, 35, 2, 979);
    			add_location(br0, file, 59, 4, 1697);
    			add_location(br1, file, 61, 4, 1742);
    			add_location(br2, file, 66, 4, 1844);
    			attr_dev(div3, "class", "results svelte-10359b1");
    			add_location(div3, file, 58, 2, 1670);
    			attr_dev(main, "class", "svelte-10359b1");
    			add_location(main, file, 32, 0, 915);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(main, t0);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(div1, t2);
    			append_dev(div1, form);
    			mount_component(autocomplete, form, null);
    			append_dev(main, t3);
    			append_dev(main, div3);
    			append_dev(div3, br0);
    			append_dev(div3, t4);
    			mount_component(city_1, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, br1);
    			append_dev(div3, t6);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, br2);
    			append_dev(div3, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div3, t9);
    			if (if_block1) if_block1.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const autocomplete_changes = {};

    			if (!updating_selectedItem && dirty & /*selectedCountry*/ 1) {
    				updating_selectedItem = true;
    				autocomplete_changes.selectedItem = /*selectedCountry*/ ctx[0];
    				add_flush_callback(() => updating_selectedItem = false);
    			}

    			autocomplete.$set(autocomplete_changes);
    			const city_1_changes = {};
    			if (dirty & /*city*/ 2) city_1_changes.city = /*city*/ ctx[1];
    			if (dirty & /*fav_value*/ 4) city_1_changes.fav_value = /*fav_value*/ ctx[2];
    			city_1.$set(city_1_changes);

    			if (/*fav_value*/ ctx[2].length > 0) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div3, t7);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*fav_value*/ 4) {
    				each_value = /*fav_value*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, t9);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*fav_value*/ ctx[2].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(div3, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocomplete.$$.fragment, local);
    			transition_in(city_1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocomplete.$$.fragment, local);
    			transition_out(city_1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(autocomplete);
    			destroy_component(city_1);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function searchCountry(keyword) {
    	const url = "http://geodb-free-service.wirefreethought.com/v1/geo/cities?namePrefix=" + encodeURIComponent(keyword) + "&type=CITY&limit=10&offset=0&languageCode=fr";
    	const response = await fetch(url);
    	return (await response.json()).data.filter(r => r.type === "CITY");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let selectedCountry;
    	let city;
    	let fav_value = [];

    	fav.subscribe(value => {
    		if (value.constructor === Array) $$invalidate(2, fav_value = value);
    	});

    	var loading = false;

    	async function submitHandler() {
    		if (!selectedCountry || !selectedCountry.city) return;

    		//submit handler function
    		loading = true; //chage loading state to true

    		$$invalidate(1, city = selectedCountry.city);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function autocomplete_selectedItem_binding(value) {
    		selectedCountry = value;
    		$$invalidate(0, selectedCountry);
    	}

    	const click_handler = () => {
    		fav.set([]);
    		localStorage.setItem("fav", JSON.stringify([]));
    	};

    	$$self.$capture_state = () => ({
    		AutoComplete: SimpleAutocomplete,
    		City,
    		selectedCountry,
    		fav,
    		city,
    		fav_value,
    		searchCountry,
    		loading,
    		submitHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedCountry" in $$props) $$invalidate(0, selectedCountry = $$props.selectedCountry);
    		if ("city" in $$props) $$invalidate(1, city = $$props.city);
    		if ("fav_value" in $$props) $$invalidate(2, fav_value = $$props.fav_value);
    		if ("loading" in $$props) loading = $$props.loading;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedCountry,
    		city,
    		fav_value,
    		submitHandler,
    		autocomplete_selectedItem_binding,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Essec meteo app'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
