
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
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
            mount_component(component, options.target, options.anchor);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
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

    const logs = writable([]);

    const pad = (n, num = 2) => String(n).padStart(num, '0');

    const getTime = () => {
        const d = new Date();
        const h = pad(d.getHours());
        const m = pad(d.getMinutes());
        const s = pad(d.getSeconds());
        const ms = pad(d.getMilliseconds(), 3);
        return `${h}:${m}:${s}:${ms} `
    };

    function Logger (summary = "", ...details) {
        const l = details.length;
        if (l == 0) details = summary;
        if (l == 1) details = details[0];
        const event = { time: getTime(), summary, details };
        logs.update(prev => [...prev, event]);
    }

    function log (...args) {
        {
            const sampleSize = 100;
            const sampleJSON = JSON.stringify([...args]);
            let s1 = sampleJSON;
            let s2 = '';
            let css = '';
            if (sampleJSON.length > sampleSize) {
                s1 = sampleJSON.slice(0, sampleSize);
                s2 = ' %c ...more ';
                css = 'color:white;background:green;font-size:.8em;';
            }
            console.groupCollapsed(s1 + s2, css);
            console.log.apply(null, args);
            console.groupCollapsed('   ...log trace HERE collapsed');
            console.trace();
            console.groupEnd();
            console.groupEnd();
        }
        Logger.apply(null, args);
    }

    const userLoggedIn = writable(false);
    const user = writable({});

    /* src/Google.svelte generated by Svelte v3.32.3 */
    const file = "src/Google.svelte";

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let div1;
    	let div0;
    	let t1;
    	let div2;
    	let a;
    	let t3;
    	let pre;
    	let t4_value = JSON.stringify(/*$user*/ ctx[2], null, 2) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			t1 = space();
    			div2 = element("div");
    			a = element("a");
    			a.textContent = "Sign out";
    			t3 = space();
    			pre = element("pre");
    			t4 = text(t4_value);
    			if (script.src !== (script_src_value = "https://apis.google.com/js/platform.js?onload=onLoadCallback")) attr_dev(script, "src", script_src_value);
    			script.async = true;
    			script.defer = true;
    			add_location(script, file, 54, 4, 1542);
    			attr_dev(div0, "class", "g-signin2");
    			attr_dev(div0, "data-theme", "dark");
    			attr_dev(div0, "data-longtitle", "true");
    			attr_dev(div0, "data-onsuccess", "onSignIn");
    			add_location(div0, file, 60, 4, 1734);
    			set_style(div1, "display", "none");
    			add_location(div1, file, 59, 0, 1678);
    			attr_dev(a, "href", "javascript:signOut()");
    			add_location(a, file, 69, 4, 1976);
    			add_location(pre, file, 70, 4, 2024);
    			set_style(div2, "display", "none");
    			add_location(div2, file, 67, 0, 1869);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			/*div1_binding*/ ctx[3](div1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, a);
    			append_dev(div2, t3);
    			append_dev(div2, pre);
    			append_dev(pre, t4);
    			/*div2_binding*/ ctx[4](div2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$user*/ 4 && t4_value !== (t4_value = JSON.stringify(/*$user*/ ctx[2], null, 2) + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[3](null);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			/*div2_binding*/ ctx[4](null);
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
    	let $userLoggedIn;
    	let $user;
    	validate_store(userLoggedIn, "userLoggedIn");
    	component_subscribe($$self, userLoggedIn, $$value => $$invalidate(6, $userLoggedIn = $$value));
    	validate_store(user, "user");
    	component_subscribe($$self, user, $$value => $$invalidate(2, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Google", slots, []);
    	let signinButton;
    	let signoutButton;
    	let mounted = false;

    	const statusChanged = p => {
    		if (!mounted) return;

    		if ($userLoggedIn) {
    			$$invalidate(0, signinButton.style.display = "none", signinButton);
    			$$invalidate(1, signoutButton.style.display = "block", signoutButton);
    		} else {
    			$$invalidate(0, signinButton.style.display = "block", signinButton);
    			$$invalidate(1, signoutButton.style.display = "none", signoutButton);
    		}
    	};

    	window.onLoadCallback = () => {
    		const loggedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    		if ($userLoggedIn != loggedIn) userLoggedIn.set(loggedIn);

    		if (loggedIn) {
    			log(888, loggedIn);
    			onSignIn(gapi.auth2, 8);
    		}
    	};

    	window.onSignIn = (googleUser, p) => {
    		const profile = googleUser.getBasicProfile();

    		user.set({
    			id: profile.getId(),
    			name: profile.getName(),
    			picture: profile.getImageUrl(),
    			email: profile.getEmail(),
    			guser: googleUser
    		});

    		// if (!$userLoggedIn)
    		userLoggedIn.set(true);
    	};

    	window.signOut = () => {
    		const auth2 = gapi.auth2.getAuthInstance();

    		auth2.signOut().then(() => {
    			// User is now signed out
    			window.location.href = "/";
    		});
    	};

    	onMount(() => {
    		mounted = true;
    	});

    	afterUpdate(statusChanged);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Google> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			signinButton = $$value;
    			$$invalidate(0, signinButton);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			signoutButton = $$value;
    			$$invalidate(1, signoutButton);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		userLoggedIn,
    		user,
    		log,
    		signinButton,
    		signoutButton,
    		mounted,
    		statusChanged,
    		$userLoggedIn,
    		$user
    	});

    	$$self.$inject_state = $$props => {
    		if ("signinButton" in $$props) $$invalidate(0, signinButton = $$props.signinButton);
    		if ("signoutButton" in $$props) $$invalidate(1, signoutButton = $$props.signoutButton);
    		if ("mounted" in $$props) mounted = $$props.mounted;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [signinButton, signoutButton, $user, div1_binding, div2_binding];
    }

    class Google extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Google",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.3 */
    const file$1 = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let google;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let current;
    	google = new Google({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(google.$$.fragment);
    			t0 = space();
    			h1 = element("h1");
    			t1 = text("P1 ");
    			t2 = text(/*$userLoggedIn*/ ctx[0]);
    			add_location(h1, file$1, 6, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(google, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$userLoggedIn*/ 1) set_data_dev(t2, /*$userLoggedIn*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(google.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(google.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(google, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
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
    	let $userLoggedIn;
    	validate_store(userLoggedIn, "userLoggedIn");
    	component_subscribe($$self, userLoggedIn, $$value => $$invalidate(0, $userLoggedIn = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ userLoggedIn, Google, $userLoggedIn });
    	return [$userLoggedIn];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    	}
    });

    // log(13)
    // myObj = logMethods(myObj)
    // log(14)
    // myObj.a = 9
    // const x = myObj.multiply(3, 5)
    // log(myObj.squared(4))
    // log(15)
    // log(166, { x, }, myObj.a)

    log( 'In Development');
    document.title = `${ 'Dev - '}${document.title}`;

    return app;

}());
//# sourceMappingURL=bundle.js.map
