
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Substat.svelte generated by Svelte v3.14.1 */

    const { Object: Object_1 } = globals;
    const file = "src/Substat.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object_1.create(ctx);
    	child_ctx.key = list[i][0];
    	child_ctx.value = list[i][1];
    	return child_ctx;
    }

    // (23:0) {#if enhancementLevel !== '-1'}
    function create_if_block(ctx) {
    	let form;
    	let div3;
    	let div0;
    	let select;
    	let t0;
    	let div2;
    	let div1;
    	let t1;
    	let input;
    	let input_disabled_value;
    	let input_updating = false;
    	let t2;
    	let dispose;
    	let each_value = Object.entries(ctx.substats);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let if_block0 = ctx.isSelected && create_if_block_2(ctx);

    	function input_input_handler() {
    		input_updating = true;
    		ctx.input_input_handler.call(input);
    	}

    	let if_block1 = ctx.isSelected && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			div3 = element("div");
    			div0 = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(select, "class", "form-control");
    			attr_dev(select, "id", "substatType");
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file, 26, 8, 752);
    			attr_dev(div0, "class", "col-5");
    			add_location(div0, file, 25, 6, 723);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "substatValue");
    			input.disabled = input_disabled_value = ctx.selected === "0";
    			attr_dev(input, "min", ctx.min);
    			attr_dev(input, "max", ctx.max);
    			attr_dev(input, "placeholder", ctx.substatPlaceholder);
    			add_location(input, file, 41, 10, 1286);
    			attr_dev(div1, "class", "input-group mb-2");
    			add_location(div1, file, 35, 8, 1052);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file, 34, 6, 1025);
    			attr_dev(div3, "class", "form-row align-items-center");
    			add_location(div3, file, 24, 4, 674);
    			add_location(form, file, 23, 2, 662);

    			dispose = [
    				listen_dev(select, "change", ctx.select_change_handler),
    				listen_dev(input, "input", input_input_handler),
    				listen_dev(input, "change", ctx.handleChange, false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div3);
    			append_dev(div3, div0);
    			append_dev(div0, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			set_input_value(input, ctx.substatValue);
    			append_dev(div1, t2);
    			if (if_block1) if_block1.m(div1, null);
    		},
    		p: function update(changed, ctx) {
    			if (changed.Object || changed.substats) {
    				each_value = Object.entries(ctx.substats);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) {
    				select_option(select, ctx.selected);
    			}

    			if (ctx.isSelected) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (changed.selected && input_disabled_value !== (input_disabled_value = ctx.selected === "0")) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (changed.min) {
    				attr_dev(input, "min", ctx.min);
    			}

    			if (changed.max) {
    				attr_dev(input, "max", ctx.max);
    			}

    			if (changed.substatPlaceholder) {
    				attr_dev(input, "placeholder", ctx.substatPlaceholder);
    			}

    			if (!input_updating && changed.substatValue) {
    				set_input_value(input, ctx.substatValue);
    			}

    			input_updating = false;

    			if (ctx.isSelected) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(23:0) {#if enhancementLevel !== '-1'}",
    		ctx
    	});

    	return block;
    }

    // (28:10) {#each Object.entries(substats) as [key, value]}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = ctx.value.name + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = ctx.key;
    			option.value = option.__value;
    			add_location(option, file, 28, 12, 894);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(changed, ctx) {
    			if (changed.substats && t0_value !== (t0_value = ctx.value.name + "")) set_data_dev(t0, t0_value);

    			if (changed.substats && option_value_value !== (option_value_value = ctx.key)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(28:10) {#each Object.entries(substats) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    // (37:10) {#if isSelected}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("Max: ");
    			t1 = text(ctx.max);
    			attr_dev(div0, "class", "input-group-text");
    			add_location(div0, file, 38, 14, 1191);
    			attr_dev(div1, "class", "input-group-prepend d-none d-md-block");
    			add_location(div1, file, 37, 12, 1124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    		},
    		p: function update(changed, ctx) {
    			if (changed.max) set_data_dev(t1, ctx.max);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(37:10) {#if isSelected}",
    		ctx
    	});

    	return block;
    }

    // (52:10) {#if isSelected}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "%";
    			attr_dev(div0, "class", "input-group-text");
    			add_location(div0, file, 53, 14, 1679);
    			attr_dev(div1, "class", "input-group-append");
    			add_location(div1, file, 52, 12, 1631);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(52:10) {#if isSelected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let if_block = ctx.enhancementLevel !== "-1" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(changed, ctx) {
    			if (ctx.enhancementLevel !== "-1") {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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

    function instance($$self, $$props, $$invalidate) {
    	let { is88 } = $$props;
    	let { enhancementLevel } = $$props;
    	let { handleValue } = $$props;
    	let { substats } = $$props;

    	function handleChange() {
    		handleValue([substatValue, selected]);
    	}

    	const writable_props = ["is88", "enhancementLevel", "handleValue", "substats"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Substat> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate("selected", selected);
    		$$invalidate("Object", Object);
    		$$invalidate("substats", substats);
    	}

    	function input_input_handler() {
    		substatValue = to_number(this.value);
    		$$invalidate("substatValue", substatValue);
    	}

    	$$self.$set = $$props => {
    		if ("is88" in $$props) $$invalidate("is88", is88 = $$props.is88);
    		if ("enhancementLevel" in $$props) $$invalidate("enhancementLevel", enhancementLevel = $$props.enhancementLevel);
    		if ("handleValue" in $$props) $$invalidate("handleValue", handleValue = $$props.handleValue);
    		if ("substats" in $$props) $$invalidate("substats", substats = $$props.substats);
    	};

    	$$self.$capture_state = () => {
    		return {
    			is88,
    			enhancementLevel,
    			handleValue,
    			substats,
    			selected,
    			isSelected,
    			substat,
    			min,
    			max,
    			substatPlaceholder,
    			substatValue,
    			rollsNumberPlaceholder
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("is88" in $$props) $$invalidate("is88", is88 = $$props.is88);
    		if ("enhancementLevel" in $$props) $$invalidate("enhancementLevel", enhancementLevel = $$props.enhancementLevel);
    		if ("handleValue" in $$props) $$invalidate("handleValue", handleValue = $$props.handleValue);
    		if ("substats" in $$props) $$invalidate("substats", substats = $$props.substats);
    		if ("selected" in $$props) $$invalidate("selected", selected = $$props.selected);
    		if ("isSelected" in $$props) $$invalidate("isSelected", isSelected = $$props.isSelected);
    		if ("substat" in $$props) $$invalidate("substat", substat = $$props.substat);
    		if ("min" in $$props) $$invalidate("min", min = $$props.min);
    		if ("max" in $$props) $$invalidate("max", max = $$props.max);
    		if ("substatPlaceholder" in $$props) $$invalidate("substatPlaceholder", substatPlaceholder = $$props.substatPlaceholder);
    		if ("substatValue" in $$props) $$invalidate("substatValue", substatValue = $$props.substatValue);
    		if ("rollsNumberPlaceholder" in $$props) rollsNumberPlaceholder = $$props.rollsNumberPlaceholder;
    	};

    	let selected;
    	let isSelected;
    	let substat;
    	let min;
    	let max;
    	let substatPlaceholder;
    	let substatValue;
    	let rollsNumberPlaceholder;

    	$$self.$$.update = (changed = { selected: 1, substats: 1, is88: 1, substat: 1, enhancementLevel: 1, isSelected: 1, min: 1, max: 1 }) => {
    		if (changed.selected) {
    			 $$invalidate("isSelected", isSelected = selected !== "0");
    		}

    		if (changed.substats || changed.selected) {
    			 $$invalidate("substat", substat = substats[selected]);
    		}

    		if (changed.is88 || changed.substat) {
    			 $$invalidate("min", min = is88 ? substat.min88 : substat.min);
    		}

    		if (changed.is88 || changed.substat || changed.enhancementLevel) {
    			 $$invalidate("max", max = (is88 ? substat.max88 : substat.max) * (Number(enhancementLevel) + 1));
    		}

    		if (changed.isSelected || changed.min || changed.max) {
    			 $$invalidate("substatPlaceholder", substatPlaceholder = isSelected ? `${min}-${max}` : "N/A");
    		}

    		if (changed.isSelected || changed.enhancementLevel) {
    			 rollsNumberPlaceholder = isSelected
    			? `0-${enhancementLevel}`
    			: "Set amount of rolls";
    		}
    	};

    	 $$invalidate("selected", selected = "0");
    	 $$invalidate("substatValue", substatValue = "");

    	return {
    		is88,
    		enhancementLevel,
    		handleValue,
    		substats,
    		handleChange,
    		selected,
    		isSelected,
    		min,
    		max,
    		substatPlaceholder,
    		substatValue,
    		select_change_handler,
    		input_input_handler
    	};
    }

    class Substat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			is88: 0,
    			enhancementLevel: 0,
    			handleValue: 0,
    			substats: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Substat",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.is88 === undefined && !("is88" in props)) {
    			console.warn("<Substat> was created without expected prop 'is88'");
    		}

    		if (ctx.enhancementLevel === undefined && !("enhancementLevel" in props)) {
    			console.warn("<Substat> was created without expected prop 'enhancementLevel'");
    		}

    		if (ctx.handleValue === undefined && !("handleValue" in props)) {
    			console.warn("<Substat> was created without expected prop 'handleValue'");
    		}

    		if (ctx.substats === undefined && !("substats" in props)) {
    			console.warn("<Substat> was created without expected prop 'substats'");
    		}
    	}

    	get is88() {
    		throw new Error("<Substat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is88(value) {
    		throw new Error("<Substat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enhancementLevel() {
    		throw new Error("<Substat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enhancementLevel(value) {
    		throw new Error("<Substat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleValue() {
    		throw new Error("<Substat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleValue(value) {
    		throw new Error("<Substat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get substats() {
    		throw new Error("<Substat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set substats(value) {
    		throw new Error("<Substat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Rating.svelte generated by Svelte v3.14.1 */

    const file$1 = "src/Rating.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let t1_value = ctx.getRating() + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("Stats rolls luck: ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "font-weight-bold text-monospace");
    			add_location(span, file$1, 23, 22, 664);
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$1, 22, 2, 617);
    			attr_dev(div1, "class", "card");
    			add_location(div1, file$1, 21, 0, 595);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, span);
    			append_dev(span, t1);
    		},
    		p: function update(changed, ctx) {
    			if (changed.getRating && t1_value !== (t1_value = ctx.getRating() + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { values } = $$props;
    	let { enhancementLevel } = $$props;
    	const writable_props = ["values", "enhancementLevel"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rating> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("values" in $$props) $$invalidate("values", values = $$props.values);
    		if ("enhancementLevel" in $$props) $$invalidate("enhancementLevel", enhancementLevel = $$props.enhancementLevel);
    	};

    	$$self.$capture_state = () => {
    		return { values, enhancementLevel, getRating };
    	};

    	$$self.$inject_state = $$props => {
    		if ("values" in $$props) $$invalidate("values", values = $$props.values);
    		if ("enhancementLevel" in $$props) $$invalidate("enhancementLevel", enhancementLevel = $$props.enhancementLevel);
    		if ("getRating" in $$props) $$invalidate("getRating", getRating = $$props.getRating);
    	};

    	let getRating;

    	$$self.$$.update = (changed = { enhancementLevel: 1, values: 1 }) => {
    		if (changed.enhancementLevel || changed.values) {
    			 $$invalidate("getRating", getRating = () => {
    				const lvl = Number(enhancementLevel) + 1;
    				const sum = values.reduce((acc, [val, max]) => acc + val * 100 / max, 0);
    				const result = sum - lvl * 100;
    				if (result < 50.1) return "F";
    				if (result < 100.5) return "E";
    				if (result < 150.51) return "D";
    				if (result < 200.51) return "C";
    				if (result < 235.51) return "B";
    				if (result < 260.1) return "A";
    				if (result < 275.1) return "S";
    				if (result < 287.51) return "SS";
    				return "SSS";
    			});
    		}
    	};

    	return { values, enhancementLevel, getRating };
    }

    class Rating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { values: 0, enhancementLevel: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rating",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.values === undefined && !("values" in props)) {
    			console.warn("<Rating> was created without expected prop 'values'");
    		}

    		if (ctx.enhancementLevel === undefined && !("enhancementLevel" in props)) {
    			console.warn("<Rating> was created without expected prop 'enhancementLevel'");
    		}
    	}

    	get values() {
    		throw new Error("<Rating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set values(value) {
    		throw new Error("<Rating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enhancementLevel() {
    		throw new Error("<Rating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enhancementLevel(value) {
    		throw new Error("<Rating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Form.svelte generated by Svelte v3.14.1 */
    const file$2 = "src/Form.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let div0;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let select_value_value;
    	let t7;
    	let div2;
    	let div1;
    	let input;
    	let t8;
    	let label;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let current;
    	let dispose;

    	const substat0 = new Substat({
    			props: {
    				is88: ctx.is88,
    				substats: ctx.substats,
    				enhancementLevel: ctx.enhancementLevel,
    				handleValue: ctx.handleValue(0)
    			},
    			$$inline: true
    		});

    	const substat1 = new Substat({
    			props: {
    				is88: ctx.is88,
    				substats: ctx.substats,
    				enhancementLevel: ctx.enhancementLevel,
    				handleValue: ctx.handleValue(1)
    			},
    			$$inline: true
    		});

    	const substat2 = new Substat({
    			props: {
    				is88: ctx.is88,
    				substats: ctx.substats,
    				enhancementLevel: ctx.enhancementLevel,
    				handleValue: ctx.handleValue(2)
    			},
    			$$inline: true
    		});

    	const substat3 = new Substat({
    			props: {
    				is88: ctx.is88,
    				substats: ctx.substats,
    				enhancementLevel: ctx.enhancementLevel,
    				handleValue: ctx.handleValue(3)
    			},
    			$$inline: true
    		});

    	const rating = new Rating({
    			props: {
    				values: ctx.values,
    				enhancementLevel: ctx.enhancementLevel
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Select enhancement level";
    			option1 = element("option");
    			option1.textContent = "None";
    			option2 = element("option");
    			option2.textContent = "3+";
    			option3 = element("option");
    			option3.textContent = "6+";
    			option4 = element("option");
    			option4.textContent = "9+";
    			option5 = element("option");
    			option5.textContent = "12+";
    			option6 = element("option");
    			option6.textContent = "15";
    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t8 = space();
    			label = element("label");
    			label.textContent = "Level 88+ equip";
    			t10 = space();
    			create_component(substat0.$$.fragment);
    			t11 = space();
    			create_component(substat1.$$.fragment);
    			t12 = space();
    			create_component(substat2.$$.fragment);
    			t13 = space();
    			create_component(substat3.$$.fragment);
    			t14 = space();
    			create_component(rating.$$.fragment);
    			option0.disabled = true;
    			option0.__value = "-1";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 28, 6, 871);
    			option1.__value = "0";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 29, 6, 940);
    			option2.__value = "1";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 30, 6, 979);
    			option3.__value = "2";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 31, 6, 1016);
    			option4.__value = "3";
    			option4.value = option4.__value;
    			add_location(option4, file$2, 32, 6, 1053);
    			option5.__value = "4";
    			option5.value = option5.__value;
    			add_location(option5, file$2, 33, 6, 1090);
    			option6.__value = "5";
    			option6.value = option6.__value;
    			add_location(option6, file$2, 34, 6, 1128);
    			attr_dev(select, "class", "form-control");
    			attr_dev(select, "id", "enhancementLevel");
    			if (ctx.enhancementLevel === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			add_location(select, file$2, 23, 4, 743);
    			attr_dev(div0, "class", "col-4");
    			add_location(div0, file$2, 22, 2, 718);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "id", "higherLevel");
    			add_location(input, file$2, 39, 6, 1248);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "higherLevel");
    			add_location(label, file$2, 44, 6, 1379);
    			attr_dev(div1, "class", "form-check mb-2");
    			add_location(div1, file$2, 38, 4, 1211);
    			attr_dev(div2, "class", "col-8");
    			add_location(div2, file$2, 37, 2, 1186);
    			attr_dev(div3, "class", "form-row align-items-center");
    			add_location(div3, file$2, 21, 0, 673);

    			dispose = [
    				listen_dev(select, "change", ctx.select_change_handler),
    				listen_dev(input, "change", ctx.input_change_handler)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			append_dev(select, option5);
    			append_dev(select, option6);
    			select_value_value = "-1";

    			for (var i = 0; i < select.options.length; i += 1) {
    				var option = select.options[i];

    				if (option.__value === select_value_value) {
    					option.selected = true;
    					break;
    				}
    			}

    			select_option(select, ctx.enhancementLevel);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			input.checked = ctx.is88;
    			append_dev(div1, t8);
    			append_dev(div1, label);
    			insert_dev(target, t10, anchor);
    			mount_component(substat0, target, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(substat1, target, anchor);
    			insert_dev(target, t12, anchor);
    			mount_component(substat2, target, anchor);
    			insert_dev(target, t13, anchor);
    			mount_component(substat3, target, anchor);
    			insert_dev(target, t14, anchor);
    			mount_component(rating, target, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (changed.enhancementLevel) {
    				select_option(select, ctx.enhancementLevel);
    			}

    			if (changed.is88) {
    				input.checked = ctx.is88;
    			}

    			const substat0_changes = {};
    			if (changed.is88) substat0_changes.is88 = ctx.is88;
    			if (changed.enhancementLevel) substat0_changes.enhancementLevel = ctx.enhancementLevel;
    			substat0.$set(substat0_changes);
    			const substat1_changes = {};
    			if (changed.is88) substat1_changes.is88 = ctx.is88;
    			if (changed.enhancementLevel) substat1_changes.enhancementLevel = ctx.enhancementLevel;
    			substat1.$set(substat1_changes);
    			const substat2_changes = {};
    			if (changed.is88) substat2_changes.is88 = ctx.is88;
    			if (changed.enhancementLevel) substat2_changes.enhancementLevel = ctx.enhancementLevel;
    			substat2.$set(substat2_changes);
    			const substat3_changes = {};
    			if (changed.is88) substat3_changes.is88 = ctx.is88;
    			if (changed.enhancementLevel) substat3_changes.enhancementLevel = ctx.enhancementLevel;
    			substat3.$set(substat3_changes);
    			const rating_changes = {};
    			if (changed.values) rating_changes.values = ctx.values;
    			if (changed.enhancementLevel) rating_changes.enhancementLevel = ctx.enhancementLevel;
    			rating.$set(rating_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(substat0.$$.fragment, local);
    			transition_in(substat1.$$.fragment, local);
    			transition_in(substat2.$$.fragment, local);
    			transition_in(substat3.$$.fragment, local);
    			transition_in(rating.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(substat0.$$.fragment, local);
    			transition_out(substat1.$$.fragment, local);
    			transition_out(substat2.$$.fragment, local);
    			transition_out(substat3.$$.fragment, local);
    			transition_out(rating.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t10);
    			destroy_component(substat0, detaching);
    			if (detaching) detach_dev(t11);
    			destroy_component(substat1, detaching);
    			if (detaching) detach_dev(t12);
    			destroy_component(substat2, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(substat3, detaching);
    			if (detaching) detach_dev(t14);
    			destroy_component(rating, detaching);
    			run_all(dispose);
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
    	let is88 = false;

    	let substats = {
    		0: {
    			min: "",
    			max: "",
    			name: "Other substat or none"
    		},
    		1: {
    			min: 4,
    			min88: 5,
    			max: 8,
    			max88: 9,
    			name: "HP/Def/Eff/EffRes/Atk"
    		},
    		2: {
    			min: 3,
    			min88: 3,
    			max: 5,
    			max88: 6,
    			name: "Crit Rate"
    		},
    		3: {
    			min: 3,
    			min88: 4,
    			max: 7,
    			max88: 8,
    			name: "Crit Dmg"
    		},
    		4: {
    			min: 1,
    			min88: 2,
    			max: 4,
    			max88: 5,
    			name: "Speed"
    		}
    	};

    	function handleValue(pos) {
    		return function ([val, selected]) {
    			$$invalidate("values", values[pos] = [val, substats[selected].max], values);
    		};
    	}

    	function select_change_handler() {
    		enhancementLevel = select_value(this);
    		$$invalidate("enhancementLevel", enhancementLevel);
    	}

    	function input_change_handler() {
    		is88 = this.checked;
    		$$invalidate("is88", is88);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("is88" in $$props) $$invalidate("is88", is88 = $$props.is88);
    		if ("substats" in $$props) $$invalidate("substats", substats = $$props.substats);
    		if ("enhancementLevel" in $$props) $$invalidate("enhancementLevel", enhancementLevel = $$props.enhancementLevel);
    		if ("values" in $$props) $$invalidate("values", values = $$props.values);
    	};

    	let enhancementLevel;
    	let values;
    	 $$invalidate("enhancementLevel", enhancementLevel = "-1");
    	 $$invalidate("values", values = []);

    	return {
    		is88,
    		substats,
    		handleValue,
    		enhancementLevel,
    		values,
    		select_change_handler,
    		input_change_handler
    	};
    }

    class Form extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Form",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.14.1 */

    function create_fragment$3(ctx) {
    	let current;
    	const form = new Form({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(form.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(form, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(form.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(form.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(form, detaching);
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

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.getElementById("app"),
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
