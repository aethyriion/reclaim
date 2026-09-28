var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
(function() {
  "use strict";
  var _started, _prev, _next, _commit_callbacks, _discard_callbacks, _pending, _blocking_pending, _deferred, _scheduled, _new_effects, _dirty_effects, _maybe_dirty_effects, _skipped_branches, _unskipped_branches, _decrement_queued, _Batch_instances, is_deferred_fn, resolve_fn, process_fn, traverse_fn, find_earlier_batch_fn, merge_fn, defer_effects_fn, commit_fn, unlink_fn, _anchor, _hydrate_open, _props, _children, _effect, _main_effect, _pending_effect, _failed_effect, _offscreen_fragment, _local_pending_count, _pending_count, _pending_count_update_queued, _dirty_effects2, _maybe_dirty_effects2, _effect_pending, _effect_pending_subscriber, _Boundary_instances, hydrate_resolved_content_fn, hydrate_failed_content_fn, create_reset_fn, hydrate_pending_content_fn, render_fn, resolve_fn2, run_fn, update_pending_count_fn, handle_error_fn, _batches, _onscreen, _offscreen, _outroing, _transition, _commit, _discard, _a;
  const DEV = false;
  var is_array = Array.isArray;
  var index_of = Array.prototype.indexOf;
  var includes = Array.prototype.includes;
  var array_from = Array.from;
  var define_property = Object.defineProperty;
  var get_descriptor = Object.getOwnPropertyDescriptor;
  var get_descriptors = Object.getOwnPropertyDescriptors;
  var object_prototype = Object.prototype;
  var array_prototype = Array.prototype;
  var get_prototype_of = Object.getPrototypeOf;
  var is_extensible = Object.isExtensible;
  const noop = () => {
  };
  function run_all(arr) {
    for (var i = 0; i < arr.length; i++) {
      arr[i]();
    }
  }
  function deferred() {
    var resolve;
    var reject;
    var promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
  const DERIVED = 1 << 1;
  const EFFECT = 1 << 2;
  const RENDER_EFFECT = 1 << 3;
  const MANAGED_EFFECT = 1 << 24;
  const BLOCK_EFFECT = 1 << 4;
  const BRANCH_EFFECT = 1 << 5;
  const ROOT_EFFECT = 1 << 6;
  const BOUNDARY_EFFECT = 1 << 7;
  const PAUSED = 1 << 8;
  const CONNECTED = 1 << 9;
  const CLEAN = 1 << 10;
  const DIRTY = 1 << 11;
  const MAYBE_DIRTY = 1 << 12;
  const INERT = 1 << 13;
  const DESTROYED = 1 << 14;
  const REACTION_RAN = 1 << 15;
  const DESTROYING = 1 << 25;
  const EFFECT_TRANSPARENT = 1 << 16;
  const EAGER_EFFECT = 1 << 17;
  const HEAD_EFFECT = 1 << 18;
  const EFFECT_PRESERVED = 1 << 19;
  const USER_EFFECT = 1 << 20;
  const EFFECT_OFFSCREEN = 1 << 25;
  const REACTION_IS_UPDATING = 1 << 21;
  const ASYNC = 1 << 22;
  const ERROR_VALUE = 1 << 23;
  const STATE_SYMBOL = Symbol("$state");
  const COMPONENT_SYMBOL = Symbol("component");
  const LEGACY_PROPS = Symbol("legacy props");
  const LOADING_ATTR_SYMBOL = Symbol("");
  const ATTRIBUTES_CACHE = Symbol("attributes");
  const CLASS_CACHE = Symbol("class");
  const STYLE_CACHE = Symbol("style");
  const TEXT_CACHE = Symbol("text");
  const FORM_RESET_HANDLER = Symbol("form reset");
  const STALE_REACTION = new class StaleReactionError extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "StaleReactionError");
      __publicField(this, "message", "The reaction that called `getAbortSignal()` was re-run or destroyed");
    }
  }();
  const EACH_ITEM_REACTIVE = 1;
  const EACH_INDEX_REACTIVE = 1 << 1;
  const EACH_IS_CONTROLLED = 1 << 2;
  const EACH_IS_ANIMATED = 1 << 3;
  const EACH_ITEM_IMMUTABLE = 1 << 4;
  const PROPS_IS_IMMUTABLE = 1;
  const PROPS_IS_UPDATED = 1 << 2;
  const PROPS_IS_BINDABLE = 1 << 3;
  const PROPS_IS_LAZY_INITIAL = 1 << 4;
  const TEMPLATE_FRAGMENT = 1;
  const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
  const UNINITIALIZED = Symbol("uninitialized");
  const NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
  function derived_inert() {
    {
      console.warn(`https://svelte.dev/e/derived_inert`);
    }
  }
  function select_multiple_invalid_value() {
    {
      console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
    }
  }
  function svelte_boundary_reset_noop() {
    {
      console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
    }
  }
  function equals(value) {
    return value === this.v;
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
  }
  function safe_equals(value) {
    return !safe_not_equal(value, this.v);
  }
  function async_derived_orphan() {
    {
      throw new Error(`https://svelte.dev/e/async_derived_orphan`);
    }
  }
  function each_key_duplicate(a, b, value) {
    {
      throw new Error(`https://svelte.dev/e/each_key_duplicate`);
    }
  }
  function effect_in_teardown(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_in_teardown`);
    }
  }
  function effect_in_unowned_derived() {
    {
      throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
    }
  }
  function effect_orphan(rune) {
    {
      throw new Error(`https://svelte.dev/e/effect_orphan`);
    }
  }
  function effect_update_depth_exceeded() {
    {
      throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
    }
  }
  function props_invalid_value(key) {
    {
      throw new Error(`https://svelte.dev/e/props_invalid_value`);
    }
  }
  function state_descriptors_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
    }
  }
  function state_prototype_fixed() {
    {
      throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
    }
  }
  function state_unsafe_mutation() {
    {
      throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
    }
  }
  function svelte_boundary_reset_onerror() {
    {
      throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
    }
  }
  let tracing_mode_flag = false;
  let component_context = null;
  function set_component_context(context) {
    component_context = context;
  }
  function push(props, runes = false, fn) {
    component_context = {
      p: component_context,
      i: false,
      c: null,
      e: null,
      s: props,
      x: null,
      r: (
        /** @type {Effect} */
        active_effect
      ),
      l: null
    };
  }
  function pop(component) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    var effects = context.e;
    if (effects !== null) {
      context.e = null;
      for (var fn of effects) {
        create_user_effect(fn);
      }
    }
    context.i = true;
    component_context = context.p;
    return mark_as_component(component);
  }
  function mark_as_component(component = {}) {
    define_property(component, COMPONENT_SYMBOL, { value: true });
    return component;
  }
  function is_runes() {
    return true;
  }
  let micro_tasks = [];
  function run_micro_tasks() {
    var tasks = micro_tasks;
    micro_tasks = [];
    run_all(tasks);
  }
  function queue_micro_task(fn) {
    if (micro_tasks.length === 0 && !is_flushing_sync) {
      var tasks = micro_tasks;
      queueMicrotask(() => {
        if (tasks === micro_tasks) run_micro_tasks();
      });
    }
    micro_tasks.push(fn);
  }
  function flush_tasks() {
    while (micro_tasks.length > 0) {
      run_micro_tasks();
    }
  }
  const STATUS_MASK = -7169;
  function set_signal_status(signal, status) {
    signal.f = signal.f & STATUS_MASK | status;
  }
  function update_derived_status(derived2) {
    if ((derived2.f & CONNECTED) !== 0 || derived2.deps === null) {
      set_signal_status(derived2, CLEAN);
    } else {
      set_signal_status(derived2, MAYBE_DIRTY);
    }
  }
  function defer_effect(effect2, dirty_effects, maybe_dirty_effects) {
    if ((effect2.f & DIRTY) !== 0) {
      dirty_effects.add(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      maybe_dirty_effects.add(effect2);
    }
    set_signal_status(effect2, CLEAN);
  }
  let listening_to_form_reset = false;
  function add_form_reset_listener() {
    if (!listening_to_form_reset) {
      listening_to_form_reset = true;
      document.addEventListener(
        "reset",
        (evt) => {
          Promise.resolve().then(() => {
            if (!evt.defaultPrevented) {
              for (
                const e of
                /**@type {HTMLFormElement} */
                evt.target.elements
              ) {
                e[FORM_RESET_HANDLER]?.();
              }
            }
          });
        },
        // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
        { capture: true }
      );
    }
  }
  function without_reactive_context(fn) {
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      return fn();
    } finally {
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  function listen_to_event_and_reset_event(element, event2, handler, on_reset = handler) {
    element.addEventListener(event2, () => without_reactive_context(handler));
    const prev = (
      /** @type {any} */
      element[FORM_RESET_HANDLER]
    );
    if (prev) {
      element[FORM_RESET_HANDLER] = () => {
        prev();
        on_reset(true);
      };
    } else {
      element[FORM_RESET_HANDLER] = () => on_reset(true);
    }
    add_form_reset_listener();
  }
  function flatten(blockers, sync, async, fn) {
    const d = derived;
    var pending = blockers.filter((b) => !b.settled);
    var deriveds = sync.map(d);
    if (async.length === 0 && pending.length === 0) {
      fn(deriveds);
      return;
    }
    var parent = (
      /** @type {Effect} */
      active_effect
    );
    var restore = capture();
    var blocker_promise = pending.length === 1 ? pending[0].promise : pending.length > 1 ? Promise.all(pending.map((b) => b.promise)) : null;
    function finish(async2) {
      if ((parent.f & DESTROYED) !== 0) {
        return;
      }
      restore();
      try {
        fn([...deriveds, ...async2]);
      } catch (error) {
        invoke_error_boundary(error, parent);
      }
      unset_context();
    }
    var decrement_pending = increment_pending();
    if (async.length === 0) {
      blocker_promise.then(() => finish([])).finally(decrement_pending);
      return;
    }
    function run() {
      Promise.all(async.map((expression) => /* @__PURE__ */ async_derived(expression))).then(finish).catch((error) => invoke_error_boundary(error, parent)).finally(decrement_pending);
    }
    if (blocker_promise) {
      blocker_promise.then(() => {
        restore();
        run();
        unset_context();
      });
    } else {
      run();
    }
  }
  function capture() {
    var previous_effect = (
      /** @type {Effect} */
      active_effect
    );
    var previous_reaction = active_reaction;
    var previous_component_context = component_context;
    var previous_batch2 = (
      /** @type {Batch} */
      current_batch
    );
    return function restore(activate_batch = true) {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_component_context);
      if (activate_batch && (previous_effect.f & DESTROYED) === 0) {
        previous_batch2?.activate();
        previous_batch2?.apply();
      }
    };
  }
  function unset_context(deactivate_batch = true) {
    set_active_effect(null);
    set_active_reaction(null);
    set_component_context(null);
    if (deactivate_batch) current_batch?.deactivate();
  }
  function increment_pending() {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    var boundary2 = effect2.b;
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var blocking = !!boundary2?.is_rendered();
    boundary2?.update_pending_count(1, batch);
    batch.increment(blocking, effect2);
    return () => {
      boundary2?.update_pending_count(-1, batch);
      batch.decrement(blocking, effect2);
    };
  }
  // @__NO_SIDE_EFFECTS__
  function derived(fn) {
    var flags2 = DERIVED | DIRTY;
    if (active_effect !== null) {
      active_effect.f |= EFFECT_PRESERVED;
    }
    const signal = {
      ctx: component_context,
      deps: null,
      effects: null,
      equals,
      f: flags2,
      fn,
      reactions: null,
      rv: 0,
      v: (
        /** @type {V} */
        UNINITIALIZED
      ),
      wv: 0,
      parent: active_effect,
      ac: null
    };
    return signal;
  }
  const OBSOLETE = Symbol("obsolete");
  // @__NO_SIDE_EFFECTS__
  function async_derived(fn, label, location) {
    let parent = (
      /** @type {Effect | null} */
      active_effect
    );
    if (parent === null) {
      async_derived_orphan();
    }
    var promise = (
      /** @type {Promise<V>} */
      /** @type {unknown} */
      void 0
    );
    var signal = source(
      /** @type {V} */
      UNINITIALIZED
    );
    var should_suspend = !active_reaction;
    var deferreds = /* @__PURE__ */ new Set();
    async_effect(() => {
      var effect2 = (
        /** @type {Effect} */
        active_effect
      );
      var d = deferred();
      promise = d.promise;
      try {
        Promise.resolve(fn()).then(d.resolve, (e) => {
          if (e !== STALE_REACTION) d.reject(e);
        }).finally(unset_context);
      } catch (error) {
        d.reject(error);
        unset_context();
      }
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      if (should_suspend) {
        if ((effect2.f & REACTION_RAN) !== 0) {
          var decrement_pending = increment_pending();
        }
        if (
          // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
          parent.b?.is_rendered()
        ) {
          batch.async_deriveds.get(effect2)?.reject(OBSOLETE);
        } else {
          for (const d2 of deferreds.values()) {
            d2.reject(OBSOLETE);
          }
        }
        deferreds.add(d);
        batch.async_deriveds.set(effect2, d);
      }
      const handler = (value, error = void 0) => {
        decrement_pending?.();
        deferreds.delete(d);
        if (error === OBSOLETE) return;
        batch.activate();
        if (error) {
          signal.f |= ERROR_VALUE;
          internal_set(signal, error);
        } else {
          if ((signal.f & ERROR_VALUE) !== 0) {
            signal.f ^= ERROR_VALUE;
          }
          internal_set(signal, value);
        }
        batch.deactivate();
      };
      d.promise.then(handler, (e) => handler(null, e || "unknown"));
    });
    teardown(() => {
      for (const d of deferreds) {
        d.reject(OBSOLETE);
      }
    });
    return new Promise((fulfil) => {
      function next(p) {
        function go() {
          if (p === promise) {
            fulfil(signal);
          } else {
            next(promise);
          }
        }
        p.then(go, go);
      }
      next(promise);
    });
  }
  // @__NO_SIDE_EFFECTS__
  function user_derived(fn) {
    const d = /* @__PURE__ */ derived(fn);
    push_reaction_value(d);
    return d;
  }
  // @__NO_SIDE_EFFECTS__
  function derived_safe_equal(fn) {
    const signal = /* @__PURE__ */ derived(fn);
    signal.equals = safe_equals;
    return signal;
  }
  function destroy_derived_effects(derived2) {
    var effects = derived2.effects;
    if (effects !== null) {
      derived2.effects = null;
      for (var i = 0; i < effects.length; i += 1) {
        destroy_effect(
          /** @type {Effect} */
          effects[i]
        );
      }
    }
  }
  function execute_derived(derived2) {
    var value;
    var prev_active_effect = active_effect;
    var parent = derived2.parent;
    if (!is_destroying_effect && parent !== null && derived2.v !== UNINITIALIZED && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
    (parent.f & (DESTROYED | INERT)) !== 0) {
      derived_inert();
      return derived2.v;
    }
    set_active_effect(parent);
    {
      try {
        destroy_derived_effects(derived2);
        value = update_reaction(derived2);
      } finally {
        set_active_effect(prev_active_effect);
      }
    }
    return value;
  }
  function update_derived(derived2) {
    var value = execute_derived(derived2);
    if (!derived2.equals(value)) {
      derived2.wv = increment_write_version();
      if (!current_batch?.is_fork || derived2.deps === null) {
        if (current_batch !== null) {
          current_batch.capture(derived2, value, true);
          previous_batch?.capture(derived2, value, true);
        } else {
          derived2.v = value;
        }
        if (derived2.deps === null) {
          set_signal_status(derived2, CLEAN);
          return;
        }
      }
    }
    if (is_destroying_effect) {
      return;
    }
    if (batch_values !== null) {
      if (effect_tracking() || current_batch?.is_fork) {
        batch_values.set(derived2, value);
      }
    } else {
      update_derived_status(derived2);
    }
  }
  function freeze_derived_effects(derived2) {
    if (derived2.effects === null) return;
    for (const e of derived2.effects) {
      if (e.teardown || e.ac) {
        e.teardown?.();
        if (e.ac !== null) {
          without_reactive_context(() => {
            e.ac.abort(STALE_REACTION);
            e.ac = null;
          });
        }
        if (e.fn !== null) e.teardown = noop;
        remove_reactions(e, 0);
        destroy_effect_children(e);
      }
    }
  }
  function unfreeze_derived_effects(derived2) {
    if (derived2.effects === null) return;
    for (const e of derived2.effects) {
      if (e.teardown && e.fn !== null) {
        update_effect(e);
      }
    }
  }
  let first_batch = null;
  let last_batch = null;
  let current_batch = null;
  let previous_batch = null;
  let batch_values = null;
  let last_scheduled_effect = null;
  let is_flushing_sync = false;
  let is_processing = false;
  let collected_effects = null;
  let legacy_updates = null;
  var flush_count = 0;
  var source_stacks = /* @__PURE__ */ new Set();
  let uid = 1;
  const _Batch = class _Batch {
    constructor() {
      __privateAdd(this, _Batch_instances);
      __publicField(this, "id", uid++);
      /** True as soon as `#process` was called */
      __privateAdd(this, _started, false);
      __publicField(this, "linked", true);
      /** @type {Batch | null} */
      __privateAdd(this, _prev, null);
      /** @type {Batch | null} */
      __privateAdd(this, _next, null);
      /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
      __publicField(this, "async_deriveds", /* @__PURE__ */ new Map());
      /**
       * The current values of any signals that are updated in this batch.
       * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
       * They keys of this map are identical to `this.#previous`
       * @type {Map<Value, [any, boolean]>}
       */
      __publicField(this, "current", /* @__PURE__ */ new Map());
      /**
       * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
       * They keys of this map are identical to `this.#current`
       * @type {Map<Value, any>}
       */
      __publicField(this, "previous", /* @__PURE__ */ new Map());
      /**
       * When the batch is committed (and the DOM is updated), we need to remove old branches
       * and append new ones by calling the functions added inside (if/each/key/etc) blocks
       * @type {Set<(batch: Batch) => void>}
       */
      __privateAdd(this, _commit_callbacks, /* @__PURE__ */ new Set());
      /**
       * If a fork is discarded, we need to destroy any effects that are no longer needed
       * @type {Set<(batch: Batch) => void>}
       */
      __privateAdd(this, _discard_callbacks, /* @__PURE__ */ new Set());
      /**
       * The number of async effects that are currently in flight
       */
      __privateAdd(this, _pending, 0);
      /**
       * Async effects that are currently in flight, _not_ inside a pending boundary
       * @type {Map<Effect, number>}
       */
      __privateAdd(this, _blocking_pending, /* @__PURE__ */ new Map());
      /**
       * A deferred that resolves when the batch is committed, used with `settled()`
       * TODO replace with Promise.withResolvers once supported widely enough
       * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
       */
      __privateAdd(this, _deferred, null);
      /**
       * Effects that were scheduled in this batch but not yet 'resolved' into the
       * root effects that need to be flushed. Resolving — the upwards traversal that
       * marks the path to each effect on the shared effect tree (see #resolve) — is
       * deferred until the batch is processed, so that the markers are created and
       * consumed within a single traversal. Scheduling into other batches (which can
       * happen concurrently, e.g. while a batch is committed) can therefore never
       * observe (and be confused by) this batch's markers.
       * May contain duplicates — deduplication happens during resolving
       * @type {Effect[]}
       */
      __privateAdd(this, _scheduled, []);
      /**
       * Effects created while this batch was active.
       * @type {Effect[]}
       */
      __privateAdd(this, _new_effects, []);
      /**
       * Deferred effects (which run after async work has completed) that are DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _dirty_effects, /* @__PURE__ */ new Set());
      /**
       * Deferred effects that are MAYBE_DIRTY
       * @type {Set<Effect>}
       */
      __privateAdd(this, _maybe_dirty_effects, /* @__PURE__ */ new Set());
      /**
       * A map of branches that still exist, but will be destroyed when this batch
       * is committed — we skip over these during `process`.
       * The value contains child effects that were dirty/maybe_dirty before being reset,
       * so they can be rescheduled if the branch survives.
       * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
       */
      __privateAdd(this, _skipped_branches, /* @__PURE__ */ new Map());
      /**
       * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
       * @type {Set<Effect>}
       */
      __privateAdd(this, _unskipped_branches, /* @__PURE__ */ new Set());
      __publicField(this, "is_fork", false);
      __privateAdd(this, _decrement_queued, false);
      if (last_batch === null) {
        first_batch = last_batch = this;
      } else {
        __privateSet(last_batch, _next, this);
        __privateSet(this, _prev, last_batch);
      }
      last_batch = this;
    }
    /**
     * Add an effect to the #skipped_branches map and reset its children
     * @param {Effect} effect
     */
    skip_effect(effect2) {
      if (!__privateGet(this, _skipped_branches).has(effect2)) {
        __privateGet(this, _skipped_branches).set(effect2, { d: [], m: [] });
      }
      __privateGet(this, _unskipped_branches).delete(effect2);
    }
    /**
     * Remove an effect from the #skipped_branches map and reschedule
     * any tracked dirty/maybe_dirty child effects
     * @param {Effect} effect
     * @param {(e: Effect) => void} callback
     */
    unskip_effect(effect2, callback = (e) => this.schedule(e)) {
      var tracked = __privateGet(this, _skipped_branches).get(effect2);
      if (tracked) {
        __privateGet(this, _skipped_branches).delete(effect2);
        for (var e of tracked.d) {
          set_signal_status(e, DIRTY);
          callback(e);
        }
        for (e of tracked.m) {
          set_signal_status(e, MAYBE_DIRTY);
          callback(e);
        }
      }
      __privateGet(this, _unskipped_branches).add(effect2);
    }
    /**
     * Associate a change to a given source with the current
     * batch, noting its previous and current values
     * @param {Value} source
     * @param {any} value
     * @param {boolean} [is_derived]
     */
    capture(source2, value, is_derived = false) {
      if (source2.v !== UNINITIALIZED && !this.previous.has(source2)) {
        this.previous.set(source2, source2.v);
      }
      if ((source2.f & ERROR_VALUE) === 0) {
        this.current.set(source2, [value, is_derived]);
        batch_values?.set(source2, value);
      }
      if (!this.is_fork) {
        source2.v = value;
      }
    }
    activate() {
      current_batch = this;
    }
    deactivate() {
      current_batch = null;
      batch_values = null;
    }
    flush() {
      try {
        if (DEV) ;
        is_processing = true;
        current_batch = this;
        __privateMethod(this, _Batch_instances, process_fn).call(this);
      } finally {
        flush_count = 0;
        last_scheduled_effect = null;
        collected_effects = null;
        legacy_updates = null;
        is_processing = false;
        current_batch = null;
        batch_values = null;
        old_values.clear();
      }
    }
    discard() {
      for (const fn of __privateGet(this, _discard_callbacks)) fn(this);
      __privateGet(this, _discard_callbacks).clear();
      for (const deferred2 of this.async_deriveds.values()) {
        deferred2.reject(OBSOLETE);
      }
      __privateMethod(this, _Batch_instances, unlink_fn).call(this);
      __privateGet(this, _deferred)?.resolve();
    }
    /**
     * @param {Effect} effect
     */
    register_created_effect(effect2) {
      __privateGet(this, _new_effects).push(effect2);
    }
    /**
     * @param {boolean} blocking
     * @param {Effect} effect
     */
    increment(blocking, effect2) {
      __privateSet(this, _pending, __privateGet(this, _pending) + 1);
      if (blocking) {
        let blocking_pending_count = __privateGet(this, _blocking_pending).get(effect2) ?? 0;
        __privateGet(this, _blocking_pending).set(effect2, blocking_pending_count + 1);
      }
    }
    /**
     * @param {boolean} blocking
     * @param {Effect} effect
     */
    decrement(blocking, effect2) {
      __privateSet(this, _pending, __privateGet(this, _pending) - 1);
      if (blocking) {
        let blocking_pending_count = __privateGet(this, _blocking_pending).get(effect2) ?? 0;
        if (blocking_pending_count === 1) {
          __privateGet(this, _blocking_pending).delete(effect2);
        } else {
          __privateGet(this, _blocking_pending).set(effect2, blocking_pending_count - 1);
        }
      }
      if (__privateGet(this, _decrement_queued)) return;
      __privateSet(this, _decrement_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _decrement_queued, false);
        if (this.linked) {
          this.flush();
        }
      });
    }
    /**
     * @param {Set<Effect>} dirty_effects
     * @param {Set<Effect>} maybe_dirty_effects
     */
    transfer_effects(dirty_effects, maybe_dirty_effects) {
      for (const e of dirty_effects) {
        __privateGet(this, _dirty_effects).add(e);
      }
      for (const e of maybe_dirty_effects) {
        __privateGet(this, _maybe_dirty_effects).add(e);
      }
      dirty_effects.clear();
      maybe_dirty_effects.clear();
    }
    /** @param {(batch: Batch) => void} fn */
    oncommit(fn) {
      __privateGet(this, _commit_callbacks).add(fn);
    }
    /** @param {(batch: Batch) => void} fn */
    ondiscard(fn) {
      __privateGet(this, _discard_callbacks).add(fn);
    }
    settled() {
      return (__privateGet(this, _deferred) ?? __privateSet(this, _deferred, deferred())).promise;
    }
    static ensure() {
      if (current_batch === null) {
        const batch = current_batch = new _Batch();
        if (!is_processing && !is_flushing_sync) {
          queue_micro_task(() => {
            if (!__privateGet(batch, _started)) {
              batch.flush();
            }
          });
        }
      }
      return current_batch;
    }
    apply() {
      {
        batch_values = null;
        return;
      }
    }
    /**
     *
     * @param {Effect} effect
     */
    schedule(effect2) {
      last_scheduled_effect = effect2;
      if (effect2.b?.is_pending && (effect2.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 && (effect2.f & REACTION_RAN) === 0) {
        effect2.b.defer_effect(effect2);
        return;
      }
      __privateGet(this, _scheduled).push(effect2);
    }
  };
  _started = new WeakMap();
  _prev = new WeakMap();
  _next = new WeakMap();
  _commit_callbacks = new WeakMap();
  _discard_callbacks = new WeakMap();
  _pending = new WeakMap();
  _blocking_pending = new WeakMap();
  _deferred = new WeakMap();
  _scheduled = new WeakMap();
  _new_effects = new WeakMap();
  _dirty_effects = new WeakMap();
  _maybe_dirty_effects = new WeakMap();
  _skipped_branches = new WeakMap();
  _unskipped_branches = new WeakMap();
  _decrement_queued = new WeakMap();
  _Batch_instances = new WeakSet();
  is_deferred_fn = function() {
    if (this.is_fork) return true;
    for (const effect2 of __privateGet(this, _blocking_pending).keys()) {
      var e = effect2;
      var skipped = false;
      while (e.parent !== null) {
        if (__privateGet(this, _skipped_branches).has(e)) {
          skipped = true;
          break;
        }
        e = e.parent;
      }
      if (!skipped) {
        return true;
      }
    }
    return false;
  };
  /**
   * Convert the effects that were scheduled in this batch into the root effects
   * that need to be traversed, marking the path to each effect (by clearing the
   * `CLEAN` flag on ancestor branches) so that the traversal can find them.
   * This happens right before traversal rather than at scheduling time, so that
   * the markers left on the (shared) effect tree are created and consumed within
   * a single traversal — scheduling into other batches can never observe them
   * @returns {Effect[]}
   */
  resolve_fn = function() {
    var roots = [];
    for (const effect2 of __privateGet(this, _scheduled)) {
      if ((effect2.f & DESTROYED) !== 0 || (effect2.f & (DIRTY | MAYBE_DIRTY)) === 0) continue;
      var e = effect2;
      var covered = false;
      while (e.parent !== null) {
        e = e.parent;
        var flags2 = e.f;
        if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
          if ((flags2 & CLEAN) === 0) {
            covered = true;
            break;
          }
          e.f ^= CLEAN;
        }
      }
      if (!covered) {
        roots.push(e);
      }
    }
    __privateSet(this, _scheduled, []);
    return roots;
  };
  process_fn = function() {
    var _a2, _b, _c;
    __privateSet(this, _started, true);
    for (const e of __privateGet(this, _dirty_effects)) {
      __privateGet(this, _maybe_dirty_effects).delete(e);
      set_signal_status(e, DIRTY);
      this.schedule(e);
    }
    for (const e of __privateGet(this, _maybe_dirty_effects)) {
      set_signal_status(e, MAYBE_DIRTY);
      this.schedule(e);
    }
    this.apply();
    var effects = collected_effects = [];
    var render_effects = [];
    var updates = legacy_updates = [];
    while (__privateGet(this, _scheduled).length > 0) {
      if (flush_count++ > 1e3) {
        __privateMethod(this, _Batch_instances, unlink_fn).call(this);
        infinite_loop_guard();
      }
      for (const root2 of __privateMethod(this, _Batch_instances, resolve_fn).call(this)) {
        try {
          __privateMethod(this, _Batch_instances, traverse_fn).call(this, root2, effects, render_effects);
        } catch (e) {
          reset_all(root2);
          if (!__privateMethod(this, _Batch_instances, is_deferred_fn).call(this)) this.discard();
          throw e;
        }
      }
    }
    current_batch = null;
    if (updates.length > 0) {
      var batch = _Batch.ensure();
      for (const e of updates) {
        batch.schedule(e);
      }
    }
    collected_effects = null;
    legacy_updates = null;
    if (__privateMethod(this, _Batch_instances, is_deferred_fn).call(this)) {
      __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, render_effects);
      __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, effects);
      for (const [e, t] of __privateGet(this, _skipped_branches)) {
        reset_branch(e, t);
      }
      if (updates.length > 0) {
        /** @type {unknown} */
        __privateMethod(_a2 = current_batch, _Batch_instances, process_fn).call(_a2);
      }
      return;
    }
    const earlier_batch = __privateMethod(this, _Batch_instances, find_earlier_batch_fn).call(this);
    if (earlier_batch) {
      __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, render_effects);
      __privateMethod(this, _Batch_instances, defer_effects_fn).call(this, effects);
      __privateMethod(_b = earlier_batch, _Batch_instances, merge_fn).call(_b, this);
      return;
    }
    __privateGet(this, _dirty_effects).clear();
    __privateGet(this, _maybe_dirty_effects).clear();
    for (const fn of __privateGet(this, _commit_callbacks)) fn(this);
    __privateGet(this, _commit_callbacks).clear();
    previous_batch = this;
    flush_queued_effects(render_effects);
    flush_queued_effects(effects);
    previous_batch = null;
    __privateGet(this, _deferred)?.resolve();
    var next_batch = (
      /** @type {Batch | null} */
      /** @type {unknown} */
      current_batch
    );
    if (__privateGet(this, _pending) === 0 && (__privateGet(this, _scheduled).length === 0 || next_batch !== null)) {
      __privateMethod(this, _Batch_instances, unlink_fn).call(this);
    }
    if (__privateGet(this, _scheduled).length > 0) {
      if (next_batch !== null) {
        for (const e of __privateGet(this, _scheduled)) {
          __privateGet(next_batch, _scheduled).push(e);
        }
        __privateSet(this, _scheduled, []);
      } else {
        next_batch = this;
      }
    }
    if (next_batch !== null) {
      old_values.clear();
      __privateMethod(_c = next_batch, _Batch_instances, process_fn).call(_c);
    }
  };
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   * @param {Effect[]} effects
   * @param {Effect[]} render_effects
   */
  traverse_fn = function(root2, effects, render_effects) {
    root2.f ^= CLEAN;
    var effect2 = root2.first;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || __privateGet(this, _skipped_branches).has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if ((flags2 & EFFECT) !== 0) {
          effects.push(effect2);
        } else if (is_dirty(effect2)) {
          if ((flags2 & BLOCK_EFFECT) !== 0) __privateGet(this, _maybe_dirty_effects).add(effect2);
          update_effect(effect2);
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      while (effect2 !== null) {
        var next = effect2.next;
        if (next !== null) {
          effect2 = next;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  };
  find_earlier_batch_fn = function() {
    var batch = __privateGet(this, _prev);
    while (batch !== null) {
      if (!batch.is_fork) {
        for (const [value, [, is_derived]] of this.current) {
          if (batch.current.has(value) && !is_derived) {
            return batch;
          }
        }
      }
      batch = __privateGet(batch, _prev);
    }
    return null;
  };
  /**
   * @param {Batch} batch
   */
  merge_fn = function(batch) {
    var _a2;
    for (const [source2, value] of batch.current) {
      if (!this.previous.has(source2) && batch.previous.has(source2)) {
        this.previous.set(source2, batch.previous.get(source2));
      }
      this.current.set(source2, value);
    }
    for (const [effect2, deferred2] of batch.async_deriveds) {
      const d = this.async_deriveds.get(effect2);
      if (d) deferred2.promise.then(d.resolve).catch(d.reject);
    }
    batch.async_deriveds.clear();
    this.transfer_effects(__privateGet(batch, _dirty_effects), __privateGet(batch, _maybe_dirty_effects));
    const mark = (value) => {
      var reactions = value.reactions;
      if (reactions === null) return;
      if ((value.f & DERIVED) !== 0 && (value.f & (DIRTY | MAYBE_DIRTY)) === 0) {
        return;
      }
      for (const reaction of reactions) {
        var flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark(
            /** @type {Derived} */
            reaction
          );
        } else {
          var effect2 = (
            /** @type {Effect} */
            reaction
          );
          if (flags2 & (ASYNC | BLOCK_EFFECT) && !this.async_deriveds.has(effect2)) {
            __privateGet(this, _maybe_dirty_effects).delete(effect2);
            set_signal_status(effect2, DIRTY);
            this.schedule(effect2);
          }
        }
      }
    };
    for (const source2 of this.current.keys()) {
      mark(source2);
    }
    this.oncommit(() => batch.discard());
    __privateMethod(_a2 = batch, _Batch_instances, unlink_fn).call(_a2);
    current_batch = this;
    __privateMethod(this, _Batch_instances, process_fn).call(this);
  };
  /**
   * @param {Effect[]} effects
   */
  defer_effects_fn = function(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], __privateGet(this, _dirty_effects), __privateGet(this, _maybe_dirty_effects));
    }
  };
  commit_fn = function() {
    var _a2, _b;
    for (let batch = first_batch; batch !== null; batch = __privateGet(batch, _next)) {
      var is_earlier = batch.id < this.id;
      var sources = [];
      for (const [source3, [value, is_derived]] of this.current) {
        if (batch.current.has(source3)) {
          var batch_value = (
            /** @type {[any, boolean]} */
            batch.current.get(source3)[0]
          );
          if (is_earlier && value !== batch_value) {
            batch.current.set(source3, [value, is_derived]);
          } else {
            continue;
          }
        }
        sources.push(source3);
      }
      if (is_earlier) {
        for (const [effect2, deferred2] of this.async_deriveds) {
          const d = batch.async_deriveds.get(effect2);
          if (d) deferred2.promise.then(d.resolve).catch(d.reject);
        }
      }
      var current2 = [...batch.current.keys()].filter(
        (source3) => !/** @type {[any, boolean]} */
        batch.current.get(source3)[1]
      );
      if (!__privateGet(batch, _started) || current2.length === 0) continue;
      var others = current2.filter((source3) => !this.current.has(source3));
      if (others.length === 0) {
        if (is_earlier) {
          batch.discard();
        }
      } else if (sources.length > 0) {
        if (is_earlier) {
          for (const unskipped of __privateGet(this, _unskipped_branches)) {
            batch.unskip_effect(unskipped, (e) => {
              var _a3;
              if ((e.f & (BLOCK_EFFECT | ASYNC)) !== 0) {
                batch.schedule(e);
              } else {
                __privateMethod(_a3 = batch, _Batch_instances, defer_effects_fn).call(_a3, [e]);
              }
            });
          }
        }
        batch.activate();
        var marked = /* @__PURE__ */ new Set();
        var checked = /* @__PURE__ */ new Map();
        for (var source2 of sources) {
          mark_effects(source2, others, marked, checked);
        }
        checked = /* @__PURE__ */ new Map();
        var current_unequal = [...batch.current].filter(([c, v1]) => {
          const v2 = this.current.get(c);
          if (!v2) return true;
          return v2[0] !== v1[0] || v2[1] !== v1[1];
        }).map(([c]) => c);
        if (current_unequal.length > 0) {
          for (const effect2 of __privateGet(this, _new_effects)) {
            if ((effect2.f & (DESTROYED | INERT | EAGER_EFFECT)) === 0 && depends_on(effect2, current_unequal, checked)) {
              if ((effect2.f & (ASYNC | BLOCK_EFFECT)) !== 0) {
                set_signal_status(effect2, DIRTY);
                batch.schedule(effect2);
              } else {
                __privateGet(batch, _dirty_effects).add(effect2);
              }
            }
          }
        }
        if (__privateGet(batch, _scheduled).length > 0 && !__privateGet(batch, _decrement_queued)) {
          batch.apply();
          for (var root2 of __privateMethod(_a2 = batch, _Batch_instances, resolve_fn).call(_a2)) {
            __privateMethod(_b = batch, _Batch_instances, traverse_fn).call(_b, root2, [], []);
          }
        }
        batch.deactivate();
      }
    }
  };
  unlink_fn = function() {
    if (!this.linked) return;
    var prev = __privateGet(this, _prev);
    var next = __privateGet(this, _next);
    if (prev === null) {
      first_batch = next;
    } else {
      __privateSet(prev, _next, next);
    }
    if (next === null) {
      last_batch = prev;
    } else {
      __privateSet(next, _prev, prev);
    }
    this.linked = false;
  };
  let Batch = _Batch;
  function flushSync(fn) {
    var was_flushing_sync = is_flushing_sync;
    is_flushing_sync = true;
    try {
      var result;
      if (fn) ;
      while (true) {
        flush_tasks();
        if (current_batch === null) {
          return (
            /** @type {T} */
            result
          );
        }
        current_batch.flush();
      }
    } finally {
      is_flushing_sync = was_flushing_sync;
    }
  }
  function infinite_loop_guard() {
    try {
      effect_update_depth_exceeded();
    } catch (error) {
      invoke_error_boundary(error, last_scheduled_effect);
    }
  }
  let eager_block_effects = null;
  function flush_queued_effects(effects) {
    var length = effects.length;
    if (length === 0) return;
    var i = 0;
    while (i < length) {
      var effect2 = effects[i++];
      if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
        eager_block_effects = /* @__PURE__ */ new Set();
        update_effect(effect2);
        if (effect2.deps === null && effect2.first === null && effect2.nodes === null && effect2.teardown === null && effect2.ac === null) {
          unlink_effect(effect2);
        }
        if (eager_block_effects?.size > 0) {
          old_values.clear();
          for (const e of eager_block_effects) {
            if ((e.f & (DESTROYED | INERT)) !== 0) continue;
            const ordered_effects = [e];
            let ancestor = e.parent;
            while (ancestor !== null) {
              if (eager_block_effects.has(ancestor)) {
                eager_block_effects.delete(ancestor);
                ordered_effects.push(ancestor);
              }
              ancestor = ancestor.parent;
            }
            for (let j = ordered_effects.length - 1; j >= 0; j--) {
              const e2 = ordered_effects[j];
              if ((e2.f & (DESTROYED | INERT)) !== 0) continue;
              update_effect(e2);
            }
          }
          eager_block_effects.clear();
        }
      }
    }
    eager_block_effects = null;
  }
  function mark_effects(value, sources, marked, checked) {
    if (marked.has(value)) return;
    marked.add(value);
    if (value.reactions !== null) {
      for (const reaction of value.reactions) {
        const flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark_effects(
            /** @type {Derived} */
            reaction,
            sources,
            marked,
            checked
          );
        } else if ((flags2 & (ASYNC | BLOCK_EFFECT)) !== 0 && (flags2 & DIRTY) === 0 && depends_on(reaction, sources, checked)) {
          set_signal_status(reaction, DIRTY);
          schedule_effect(
            /** @type {Effect} */
            reaction
          );
        }
      }
    }
  }
  function depends_on(reaction, sources, checked) {
    const depends = checked.get(reaction);
    if (depends !== void 0) return depends;
    if (reaction.deps !== null) {
      for (const dep of reaction.deps) {
        if (includes.call(sources, dep)) {
          return true;
        }
        if ((dep.f & DERIVED) !== 0 && depends_on(
          /** @type {Derived} */
          dep,
          sources,
          checked
        )) {
          checked.set(
            /** @type {Derived} */
            dep,
            true
          );
          return true;
        }
      }
    }
    checked.set(reaction, false);
    return false;
  }
  function schedule_effect(effect2) {
    current_batch.schedule(effect2);
  }
  function reset_branch(effect2, tracked) {
    if ((effect2.f & BRANCH_EFFECT) !== 0 && (effect2.f & CLEAN) !== 0) {
      return;
    }
    if ((effect2.f & DIRTY) !== 0) {
      tracked.d.push(effect2);
    } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
      tracked.m.push(effect2);
    }
    set_signal_status(effect2, CLEAN);
    var e = effect2.first;
    while (e !== null) {
      reset_branch(e, tracked);
      e = e.next;
    }
  }
  function reset_all(effect2) {
    set_signal_status(effect2, CLEAN);
    var e = effect2.first;
    while (e !== null) {
      reset_all(e);
      e = e.next;
    }
  }
  let eager_effects = /* @__PURE__ */ new Set();
  const old_values = /* @__PURE__ */ new Map();
  let eager_effects_deferred = false;
  function source(v, stack) {
    var signal = {
      f: 0,
      // TODO ideally we could skip this altogether, but it causes type errors
      v,
      reactions: null,
      equals,
      rv: 0,
      wv: 0
    };
    return signal;
  }
  // @__NO_SIDE_EFFECTS__
  function state(v, stack) {
    const s = source(v);
    push_reaction_value(s);
    return s;
  }
  // @__NO_SIDE_EFFECTS__
  function mutable_source(initial_value, immutable = false, trackable = true) {
    const s = source(initial_value);
    if (!immutable) {
      s.equals = safe_equals;
    }
    return s;
  }
  function set(source2, value, should_proxy = false) {
    if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
    // to ensure we error if state is set inside an inspect effect
    (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !current_sources.has(source2))) {
      state_unsafe_mutation();
    }
    let new_value = should_proxy ? proxy(value) : value;
    return internal_set(source2, new_value, legacy_updates);
  }
  var seen = null;
  var count_deps = 0;
  function internal_set(source2, value, updated_during_traversal = null) {
    if (!source2.equals(value)) {
      if (is_destroying_effect) {
        old_values.set(source2, value);
      } else if (!old_values.has(source2)) {
        old_values.set(source2, source2.v);
      }
      var batch = Batch.ensure();
      batch.capture(source2, value);
      if ((source2.f & DERIVED) !== 0) {
        const derived2 = (
          /** @type {Derived} */
          source2
        );
        if ((source2.f & DIRTY) !== 0) {
          execute_derived(derived2);
        }
        if (batch_values === null) {
          update_derived_status(derived2);
        }
      }
      source2.wv = increment_write_version();
      seen = null;
      count_deps = 0;
      mark_reactions(source2, DIRTY, updated_during_traversal);
      seen = null;
      if (active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
        if (untracked_writes === null) {
          set_untracked_writes([source2]);
        } else {
          untracked_writes.push(source2);
        }
      }
      if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
        flush_eager_effects();
      }
    }
    return value;
  }
  function flush_eager_effects() {
    eager_effects_deferred = false;
    for (const effect2 of eager_effects) {
      if ((effect2.f & CLEAN) !== 0) {
        set_signal_status(effect2, MAYBE_DIRTY);
      }
      let dirty;
      try {
        dirty = is_dirty(effect2);
      } catch {
        dirty = true;
      }
      if (dirty) {
        update_effect(effect2);
      }
    }
    eager_effects.clear();
  }
  function increment(source2) {
    set(source2, source2.v + 1);
  }
  function mark_reactions(signal, status, updated_during_traversal) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    var length = reactions.length;
    count_deps += length;
    if (count_deps > 1e5 && seen === null) seen = /* @__PURE__ */ new Set();
    if (seen !== null) {
      if (seen.has(signal)) return;
      seen.add(signal);
    }
    for (var i = 0; i < length; i++) {
      var reaction = reactions[i];
      var flags2 = reaction.f;
      var not_dirty = (flags2 & DIRTY) === 0;
      if (not_dirty) {
        set_signal_status(reaction, status);
      }
      if ((flags2 & EAGER_EFFECT) !== 0) {
        eager_effects.add(
          /** @type {Effect} */
          reaction
        );
      } else if ((flags2 & DERIVED) !== 0) {
        var derived2 = (
          /** @type {Derived} */
          reaction
        );
        batch_values?.delete(derived2);
        mark_reactions(derived2, MAYBE_DIRTY, updated_during_traversal);
      } else if (not_dirty) {
        var effect2 = (
          /** @type {Effect} */
          reaction
        );
        if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
          eager_block_effects.add(effect2);
        }
        if (updated_during_traversal !== null) {
          updated_during_traversal.push(effect2);
        } else {
          schedule_effect(effect2);
        }
      }
    }
  }
  function proxy(value) {
    if (typeof value !== "object" || value === null || STATE_SYMBOL in value || COMPONENT_SYMBOL in value) {
      return value;
    }
    const prototype = get_prototype_of(value);
    if (prototype !== object_prototype && prototype !== array_prototype) {
      return value;
    }
    var sources = /* @__PURE__ */ new Map();
    var is_proxied_array = is_array(value);
    var version = /* @__PURE__ */ state(0);
    var parent_version = update_version;
    var with_parent = (fn) => {
      if (update_version === parent_version) {
        return fn();
      }
      var reaction = active_reaction;
      var version2 = update_version;
      set_active_reaction(null);
      set_update_version(parent_version);
      var result = fn();
      set_active_reaction(reaction);
      set_update_version(version2);
      return result;
    };
    if (is_proxied_array) {
      sources.set("length", /* @__PURE__ */ state(
        /** @type {any[]} */
        value.length
      ));
    }
    return new Proxy(
      /** @type {any} */
      value,
      {
        defineProperty(_, prop2, descriptor) {
          if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
            state_descriptors_fixed();
          }
          var s = sources.get(prop2);
          if (s === void 0) {
            with_parent(() => {
              var s2 = /* @__PURE__ */ state(descriptor.value);
              sources.set(prop2, s2);
              return s2;
            });
          } else {
            set(s, descriptor.value, true);
          }
          return true;
        },
        deleteProperty(target, prop2) {
          var s = sources.get(prop2);
          if (s === void 0) {
            if (prop2 in target) {
              const s2 = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
              sources.set(prop2, s2);
              increment(version);
            }
          } else {
            set(s, UNINITIALIZED);
            increment(version);
          }
          return true;
        },
        get(target, prop2, receiver) {
          if (prop2 === STATE_SYMBOL) {
            return value;
          }
          var s = sources.get(prop2);
          var exists = prop2 in target;
          if (s === void 0 && (!exists || get_descriptor(target, prop2)?.writable)) {
            s = with_parent(() => {
              var p = proxy(exists ? target[prop2] : UNINITIALIZED);
              var s2 = /* @__PURE__ */ state(p);
              return s2;
            });
            sources.set(prop2, s);
          }
          if (s !== void 0) {
            var v = get(s);
            return v === UNINITIALIZED ? void 0 : v;
          }
          return Reflect.get(target, prop2, receiver);
        },
        getOwnPropertyDescriptor(target, prop2) {
          this.has?.(target, prop2);
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          var s = sources.get(prop2);
          if (s !== void 0) {
            var value2 = get(s);
            if (value2 === UNINITIALIZED) {
              return void 0;
            }
            if (descriptor && "value" in descriptor) {
              descriptor.value = value2;
            } else {
              return {
                enumerable: true,
                configurable: true,
                value: value2,
                writable: true
              };
            }
          }
          return descriptor;
        },
        has(target, prop2) {
          if (prop2 === STATE_SYMBOL) {
            return true;
          }
          var s = sources.get(prop2);
          var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
          if (s !== void 0 || active_effect !== null && (!has || get_descriptor(target, prop2)?.writable)) {
            if (s === void 0) {
              s = with_parent(() => {
                var p = has ? proxy(target[prop2]) : UNINITIALIZED;
                var s2 = /* @__PURE__ */ state(p);
                return s2;
              });
              sources.set(prop2, s);
            }
            var value2 = get(s);
            if (value2 === UNINITIALIZED) {
              return false;
            }
          }
          return has;
        },
        set(target, prop2, value2, receiver) {
          var s = sources.get(prop2);
          var has = prop2 in target;
          if (is_proxied_array && prop2 === "length") {
            for (var i = value2; i < /** @type {Source<number>} */
            s.v; i += 1) {
              var other_s = sources.get(i + "");
              if (other_s !== void 0) {
                set(other_s, UNINITIALIZED);
              } else if (i in target) {
                other_s = with_parent(() => /* @__PURE__ */ state(UNINITIALIZED));
                sources.set(i + "", other_s);
              }
            }
          }
          if (s === void 0) {
            if (!has || get_descriptor(target, prop2)?.writable) {
              s = with_parent(() => /* @__PURE__ */ state(void 0));
              set(s, proxy(value2));
              sources.set(prop2, s);
            }
          } else {
            has = s.v !== UNINITIALIZED;
            var p = with_parent(() => proxy(value2));
            set(s, p);
          }
          var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
          if (descriptor?.set) {
            descriptor.set.call(receiver, value2);
          }
          if (!has) {
            if (is_proxied_array && typeof prop2 === "string") {
              var ls = (
                /** @type {Source<number>} */
                sources.get("length")
              );
              var n = Number(prop2);
              if (Number.isInteger(n) && n >= ls.v) {
                set(ls, n + 1);
              }
            }
            increment(version);
          }
          return true;
        },
        ownKeys(target) {
          get(version);
          var own_keys = Reflect.ownKeys(target).filter((key2) => {
            var source3 = sources.get(key2);
            return source3 === void 0 || source3.v !== UNINITIALIZED;
          });
          for (var [key, source2] of sources) {
            if (source2.v !== UNINITIALIZED && !(key in target)) {
              own_keys.push(key);
            }
          }
          return own_keys;
        },
        setPrototypeOf() {
          state_prototype_fixed();
        }
      }
    );
  }
  function get_proxied_value(value) {
    try {
      if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
        return value[STATE_SYMBOL];
      }
    } catch {
    }
    return value;
  }
  function is(a, b) {
    return Object.is(get_proxied_value(a), get_proxied_value(b));
  }
  var $window;
  var is_firefox;
  var first_child_getter;
  var next_sibling_getter;
  function init_operations() {
    if ($window !== void 0) {
      return;
    }
    $window = window;
    is_firefox = /Firefox/.test(navigator.userAgent);
    var element_prototype = Element.prototype;
    var node_prototype = Node.prototype;
    var text_prototype = Text.prototype;
    first_child_getter = get_descriptor(node_prototype, "firstChild").get;
    next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
    if (is_extensible(element_prototype)) {
      element_prototype[CLASS_CACHE] = void 0;
      element_prototype[ATTRIBUTES_CACHE] = null;
      element_prototype[STYLE_CACHE] = void 0;
      element_prototype.__e = void 0;
    }
    if (is_extensible(text_prototype)) {
      text_prototype[TEXT_CACHE] = void 0;
    }
  }
  function create_text(value = "") {
    return document.createTextNode(value);
  }
  // @__NO_SIDE_EFFECTS__
  function get_first_child(node) {
    return (
      /** @type {TemplateNode | null} */
      first_child_getter.call(node)
    );
  }
  // @__NO_SIDE_EFFECTS__
  function get_next_sibling(node) {
    return (
      /** @type {TemplateNode | null} */
      next_sibling_getter.call(node)
    );
  }
  function child(node, is_text) {
    {
      return /* @__PURE__ */ get_first_child(node);
    }
  }
  function first_child(node, is_text = false) {
    {
      var first = /* @__PURE__ */ get_first_child(node);
      if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
      return first;
    }
  }
  function only_child(node, is_text = false) {
    {
      return /* @__PURE__ */ get_first_child(node);
    }
  }
  function sibling(node, count = 1, is_text = false) {
    let next_sibling = node;
    while (count--) {
      next_sibling = /** @type {TemplateNode} */
      /* @__PURE__ */ get_next_sibling(next_sibling);
    }
    {
      return next_sibling;
    }
  }
  function clear_text_content(node) {
    node.textContent = "";
  }
  function should_defer_append() {
    return false;
  }
  function create_element(tag, namespace, is2) {
    {
      return (
        /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
        is2 ? document.createElement(tag, { is: is2 }) : document.createElement(tag)
      );
    }
  }
  function handle_error(error) {
    var effect2 = active_effect;
    if (effect2 === null) {
      active_reaction.f |= ERROR_VALUE;
      return error;
    }
    if ((effect2.f & REACTION_RAN) === 0 && (effect2.f & EFFECT) === 0) {
      throw error;
    }
    invoke_error_boundary(error, effect2);
  }
  function invoke_error_boundary(error, effect2) {
    if (effect2 !== null && (effect2.f & DESTROYED) !== 0) {
      return;
    }
    while (effect2 !== null) {
      if ((effect2.f & BOUNDARY_EFFECT) !== 0 && (effect2.f & (DESTROYED | DESTROYING)) === 0) {
        if ((effect2.f & REACTION_RAN) === 0) {
          throw error;
        }
        try {
          effect2.b.error(error);
          return;
        } catch (e) {
          error = e;
        }
      }
      effect2 = effect2.parent;
    }
    throw error;
  }
  function validate_effect(rune) {
    if (active_effect === null) {
      if (active_reaction === null) {
        effect_orphan();
      }
      effect_in_unowned_derived();
    }
    if (is_destroying_effect) {
      effect_in_teardown();
    }
  }
  function push_effect(effect2, parent_effect) {
    var parent_last = parent_effect.last;
    if (parent_last === null) {
      parent_effect.last = parent_effect.first = effect2;
    } else {
      parent_last.next = effect2;
      effect2.prev = parent_last;
      parent_effect.last = effect2;
    }
  }
  function create_effect(type, fn) {
    var parent = active_effect;
    if (parent !== null && (parent.f & INERT) !== 0) {
      type |= INERT;
    }
    var effect2 = {
      ctx: component_context,
      deps: null,
      nodes: null,
      f: type | DIRTY | CONNECTED,
      first: null,
      fn,
      last: null,
      next: null,
      parent,
      b: parent && parent.b,
      prev: null,
      teardown: null,
      wv: 0,
      ac: null
    };
    current_batch?.register_created_effect(effect2);
    var e = effect2;
    if ((type & EFFECT) !== 0) {
      if (collected_effects !== null) {
        collected_effects.push(effect2);
      } else {
        Batch.ensure().schedule(effect2);
      }
    } else if (fn !== null) {
      try {
        update_effect(effect2);
      } catch (e2) {
        destroy_effect(effect2);
        throw e2;
      }
      if (e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
      (e.f & EFFECT_PRESERVED) === 0) {
        e = e.first;
        if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
          e.f |= EFFECT_TRANSPARENT;
        }
      }
    }
    if (e !== null) {
      e.parent = parent;
      if (parent !== null) {
        push_effect(e, parent);
      }
      if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
        var derived2 = (
          /** @type {Derived} */
          active_reaction
        );
        (derived2.effects ?? (derived2.effects = [])).push(e);
      }
    }
    return effect2;
  }
  function effect_tracking() {
    return active_reaction !== null && !untracking;
  }
  function teardown(fn) {
    const effect2 = create_effect(RENDER_EFFECT, null);
    set_signal_status(effect2, CLEAN);
    effect2.teardown = fn;
    return effect2;
  }
  function user_effect(fn) {
    validate_effect();
    var flags2 = (
      /** @type {Effect} */
      active_effect.f
    );
    var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && component_context !== null && !component_context.i;
    if (defer) {
      var context = (
        /** @type {ComponentContext} */
        component_context
      );
      (context.e ?? (context.e = [])).push(fn);
    } else {
      return create_user_effect(fn);
    }
  }
  function create_user_effect(fn) {
    return create_effect(EFFECT | USER_EFFECT, fn);
  }
  function component_root(fn) {
    Batch.ensure();
    const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
    return (options = {}) => {
      return new Promise((fulfil) => {
        if (options.outro) {
          pause_effect(effect2, () => {
            destroy_effect(effect2);
            fulfil(void 0);
          });
        } else {
          destroy_effect(effect2);
          fulfil(void 0);
        }
      });
    };
  }
  function effect(fn) {
    return create_effect(EFFECT, fn);
  }
  function async_effect(fn) {
    return create_effect(ASYNC | EFFECT_PRESERVED, fn);
  }
  function render_effect(fn, flags2 = 0) {
    return create_effect(RENDER_EFFECT | flags2, fn);
  }
  function template_effect(fn, sync = [], async = [], blockers = []) {
    flatten(blockers, sync, async, (values) => {
      create_effect(RENDER_EFFECT, () => {
        fn(...values.map(get));
      });
    });
  }
  function block(fn, flags2 = 0) {
    var effect2 = create_effect(BLOCK_EFFECT | flags2, fn);
    return effect2;
  }
  function branch(fn) {
    return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn);
  }
  function execute_effect_teardown(effect2) {
    var teardown2 = effect2.teardown;
    if (teardown2 !== null) {
      const previously_destroying_effect = is_destroying_effect;
      const previous_reaction = active_reaction;
      set_is_destroying_effect(true);
      set_active_reaction(null);
      try {
        teardown2.call(null);
      } catch (error) {
        invoke_error_boundary(error, effect2.parent);
      } finally {
        set_is_destroying_effect(previously_destroying_effect);
        set_active_reaction(previous_reaction);
      }
    }
  }
  function destroy_effect_children(signal, remove_dom = false) {
    var effect2 = signal.first;
    signal.first = signal.last = null;
    while (effect2 !== null) {
      const controller = effect2.ac;
      if (controller !== null) {
        without_reactive_context(() => {
          controller.abort(STALE_REACTION);
        });
      }
      var next = effect2.next;
      if ((effect2.f & ROOT_EFFECT) !== 0) {
        effect2.parent = null;
      } else {
        destroy_effect(effect2, remove_dom);
      }
      effect2 = next;
    }
  }
  function destroy_block_effect_children(signal) {
    var effect2 = signal.first;
    while (effect2 !== null) {
      var next = effect2.next;
      if ((effect2.f & BRANCH_EFFECT) === 0) {
        destroy_effect(effect2);
      }
      effect2 = next;
    }
  }
  function destroy_effect(effect2, remove_dom = true) {
    var removed = false;
    if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes !== null && effect2.nodes.end !== null) {
      remove_effect_dom(
        effect2.nodes.start,
        /** @type {TemplateNode} */
        effect2.nodes.end
      );
      removed = true;
    }
    effect2.f |= DESTROYING;
    destroy_effect_children(effect2, remove_dom && !removed);
    remove_reactions(effect2, 0);
    var transitions = effect2.nodes && effect2.nodes.t;
    if (transitions !== null) {
      for (const transition of transitions) {
        transition.stop();
      }
    }
    execute_effect_teardown(effect2);
    effect2.f ^= DESTROYING;
    effect2.f |= DESTROYED;
    var parent = effect2.parent;
    if (parent !== null && parent.first !== null) {
      unlink_effect(effect2);
    }
    effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = effect2.b = null;
  }
  function remove_effect_dom(node, end) {
    while (node !== null) {
      var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
      node.remove();
      node = next;
    }
  }
  function unlink_effect(effect2) {
    var parent = effect2.parent;
    var prev = effect2.prev;
    var next = effect2.next;
    if (prev !== null) prev.next = next;
    if (next !== null) next.prev = prev;
    if (parent !== null) {
      if (parent.first === effect2) parent.first = next;
      if (parent.last === effect2) parent.last = prev;
    }
  }
  function pause_effect(effect2, callback, destroy = true) {
    var transitions = [];
    effect2.f |= PAUSED;
    pause_children(effect2, transitions, true);
    var fn = () => {
      if (destroy) destroy_effect(effect2);
      if (callback) callback();
    };
    var remaining = transitions.length;
    if (remaining > 0) {
      var check = () => --remaining || fn();
      for (var transition of transitions) {
        transition.out(check);
      }
    } else {
      fn();
    }
  }
  function pause_children(effect2, transitions, local) {
    if ((effect2.f & INERT) !== 0) return;
    effect2.f ^= INERT;
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition of t) {
        if (transition.is_global || local) {
          transitions.push(transition);
        }
      }
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      if ((child2.f & ROOT_EFFECT) === 0) {
        var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
        // it means the parent block effect was pruned. In that case,
        // transparency information was transferred to the branch effect.
        (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
        pause_children(child2, transitions, transparent ? local : false);
      }
      child2 = sibling2;
    }
  }
  function resume_effect(effect2) {
    effect2.f &= ~PAUSED;
    resume_children(effect2, true);
  }
  function resume_children(effect2, local) {
    if ((effect2.f & PAUSED) !== 0) return;
    if ((effect2.f & INERT) === 0) return;
    effect2.f ^= INERT;
    if ((effect2.f & CLEAN) === 0) {
      set_signal_status(effect2, DIRTY);
      Batch.ensure().schedule(effect2);
    }
    var child2 = effect2.first;
    while (child2 !== null) {
      var sibling2 = child2.next;
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
      resume_children(child2, transparent ? local : false);
      child2 = sibling2;
    }
    var t = effect2.nodes && effect2.nodes.t;
    if (t !== null) {
      for (const transition of t) {
        if (transition.is_global || local) {
          transition.in();
        }
      }
    }
  }
  function move_effect(effect2, fragment) {
    if (!effect2.nodes) return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    while (node !== null) {
      var next = node === end ? null : /* @__PURE__ */ get_next_sibling(node);
      fragment.append(node);
      node = next;
    }
  }
  let is_updating_effect = false;
  let is_destroying_effect = false;
  function set_is_destroying_effect(value) {
    is_destroying_effect = value;
  }
  let active_reaction = null;
  let untracking = false;
  function set_active_reaction(reaction) {
    active_reaction = reaction;
  }
  let active_effect = null;
  function set_active_effect(effect2) {
    active_effect = effect2;
  }
  let current_sources = null;
  function push_reaction_value(value) {
    if (active_reaction !== null && ((active_reaction.f & REACTION_IS_UPDATING) !== 0 || (active_reaction.f & DERIVED) !== 0)) {
      (current_sources ?? (current_sources = /* @__PURE__ */ new Set())).add(value);
    }
  }
  let new_deps = null;
  let skipped_deps = 0;
  let untracked_writes = null;
  function set_untracked_writes(value) {
    untracked_writes = value;
  }
  let write_version = 1;
  let read_version = 0;
  let update_version = read_version;
  function set_update_version(value) {
    update_version = value;
  }
  function increment_write_version() {
    return ++write_version;
  }
  function is_dirty(reaction) {
    var flags2 = reaction.f;
    if ((flags2 & DIRTY) !== 0) {
      return true;
    }
    if ((flags2 & MAYBE_DIRTY) !== 0) {
      var dependencies = (
        /** @type {Value[]} */
        reaction.deps
      );
      var length = dependencies.length;
      for (var i = 0; i < length; i++) {
        var dependency = dependencies[i];
        if (is_dirty(
          /** @type {Derived} */
          dependency
        )) {
          update_derived(
            /** @type {Derived} */
            dependency
          );
        }
        if (dependency.wv > reaction.wv) {
          return true;
        }
      }
      if ((flags2 & CONNECTED) !== 0 && // During time traveling we don't want to reset the status so that
      // traversal of the graph in the other batches still happens
      batch_values === null) {
        set_signal_status(reaction, CLEAN);
      }
    }
    return false;
  }
  function schedule_possible_effect_self_invalidation(signal, effect2, root2 = true) {
    var reactions = signal.reactions;
    if (reactions === null) return;
    if (current_sources !== null && current_sources.has(signal)) {
      return;
    }
    for (var i = 0; i < reactions.length; i++) {
      var reaction = reactions[i];
      if ((reaction.f & DERIVED) !== 0) {
        schedule_possible_effect_self_invalidation(
          /** @type {Derived} */
          reaction,
          effect2,
          false
        );
      } else if (effect2 === reaction) {
        if (root2) {
          set_signal_status(reaction, DIRTY);
        } else if ((reaction.f & CLEAN) !== 0) {
          set_signal_status(reaction, MAYBE_DIRTY);
        }
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
  function update_reaction(reaction) {
    var previous_deps = new_deps;
    var previous_skipped_deps = skipped_deps;
    var previous_untracked_writes = untracked_writes;
    var previous_reaction = active_reaction;
    var previous_sources = current_sources;
    var previous_component_context = component_context;
    var previous_untracking = untracking;
    var previous_update_version = update_version;
    var flags2 = reaction.f;
    new_deps = /** @type {null | Value[]} */
    null;
    skipped_deps = 0;
    untracked_writes = null;
    active_reaction = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
    current_sources = null;
    set_component_context(reaction.ctx);
    untracking = false;
    update_version = ++read_version;
    if (reaction.ac !== null) {
      without_reactive_context(() => {
        reaction.ac.abort(STALE_REACTION);
      });
      reaction.ac = null;
    }
    try {
      reaction.f |= REACTION_IS_UPDATING;
      var fn = (
        /** @type {Function} */
        reaction.fn
      );
      var result = fn();
      reaction.f |= REACTION_RAN;
      var deps = update_dependencies(reaction);
      if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
        for (var i = 0; i < /** @type {Source[]} */
        untracked_writes.length; i++) {
          schedule_possible_effect_self_invalidation(
            untracked_writes[i],
            /** @type {Effect} */
            reaction
          );
        }
      }
      if (previous_reaction !== null && previous_reaction !== reaction) {
        read_version++;
        if (previous_reaction.deps !== null) {
          for (let i2 = 0; i2 < previous_skipped_deps; i2 += 1) {
            previous_reaction.deps[i2].rv = read_version;
          }
        }
        if (previous_deps !== null) {
          for (const dep of previous_deps) {
            dep.rv = read_version;
          }
        }
        if (untracked_writes !== null) {
          if (previous_untracked_writes === null) {
            previous_untracked_writes = untracked_writes;
          } else {
            previous_untracked_writes.push(.../** @type {Source[]} */
            untracked_writes);
          }
        }
      }
      if ((reaction.f & ERROR_VALUE) !== 0) {
        reaction.f ^= ERROR_VALUE;
      }
      return result;
    } catch (error) {
      update_dependencies(reaction);
      return handle_error(error);
    } finally {
      reaction.f ^= REACTION_IS_UPDATING;
      new_deps = previous_deps;
      skipped_deps = previous_skipped_deps;
      untracked_writes = previous_untracked_writes;
      active_reaction = previous_reaction;
      current_sources = previous_sources;
      set_component_context(previous_component_context);
      untracking = previous_untracking;
      update_version = previous_update_version;
    }
  }
  function update_dependencies(reaction) {
    var _a2;
    var deps = reaction.deps;
    var is_fork = current_batch?.is_fork;
    if (new_deps !== null) {
      var i;
      if (!is_fork) {
        remove_reactions(reaction, skipped_deps);
      }
      if (deps !== null && skipped_deps > 0) {
        deps.length = skipped_deps + new_deps.length;
        for (i = 0; i < new_deps.length; i++) {
          deps[skipped_deps + i] = new_deps[i];
        }
      } else {
        reaction.deps = deps = new_deps;
      }
      if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
        for (i = skipped_deps; i < deps.length; i++) {
          ((_a2 = deps[i]).reactions ?? (_a2.reactions = [])).push(reaction);
        }
      }
    } else if (!is_fork && deps !== null && skipped_deps < deps.length) {
      remove_reactions(reaction, skipped_deps);
      deps.length = skipped_deps;
    }
    return deps;
  }
  function remove_reaction(signal, dependency) {
    let reactions = dependency.reactions;
    if (reactions !== null) {
      var index = index_of.call(reactions, signal);
      if (index !== -1) {
        var new_length = reactions.length - 1;
        if (new_length === 0) {
          reactions = dependency.reactions = null;
        } else {
          reactions[index] = reactions[new_length];
          reactions.pop();
        }
      }
    }
    if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
    // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
    // allows us to skip the expensive work of disconnecting and immediately reconnecting it
    (new_deps === null || !includes.call(new_deps, dependency))) {
      var derived2 = (
        /** @type {Derived} */
        dependency
      );
      if ((derived2.f & CONNECTED) !== 0) {
        derived2.f ^= CONNECTED;
      }
      if (derived2.v !== UNINITIALIZED) {
        update_derived_status(derived2);
      }
      if (derived2.ac !== null) {
        without_reactive_context(() => {
          derived2.ac.abort(STALE_REACTION);
          derived2.ac = null;
          set_signal_status(derived2, DIRTY);
        });
      }
      freeze_derived_effects(derived2);
      remove_reactions(derived2, 0);
    }
  }
  function remove_reactions(signal, start_index) {
    var dependencies = signal.deps;
    if (dependencies === null) return;
    for (var i = start_index; i < dependencies.length; i++) {
      remove_reaction(signal, dependencies[i]);
    }
  }
  function update_effect(effect2) {
    var flags2 = effect2.f;
    if ((flags2 & DESTROYED) !== 0) {
      return;
    }
    set_signal_status(effect2, CLEAN);
    var previous_effect = active_effect;
    var was_updating_effect = is_updating_effect;
    active_effect = effect2;
    is_updating_effect = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0;
    try {
      if ((flags2 & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
        destroy_block_effect_children(effect2);
      } else {
        destroy_effect_children(effect2);
      }
      execute_effect_teardown(effect2);
      var teardown2 = update_reaction(effect2);
      effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
      effect2.wv = write_version;
      var dep;
      if (DEV && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) ;
    } finally {
      is_updating_effect = was_updating_effect;
      active_effect = previous_effect;
    }
  }
  async function tick() {
    await Promise.resolve();
    flushSync();
  }
  function get(signal) {
    var flags2 = signal.f;
    var is_derived = (flags2 & DERIVED) !== 0;
    if (active_reaction !== null && !untracking) {
      var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
      if (!destroyed && (current_sources === null || !current_sources.has(signal))) {
        var deps = active_reaction.deps;
        if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
          if (signal.rv < read_version) {
            signal.rv = read_version;
            if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
              skipped_deps++;
            } else if (new_deps === null) {
              new_deps = [signal];
            } else {
              new_deps.push(signal);
            }
          }
        } else {
          active_reaction.deps ?? (active_reaction.deps = []);
          if (!includes.call(active_reaction.deps, signal)) {
            active_reaction.deps.push(signal);
          }
          var reactions = signal.reactions;
          if (reactions === null) {
            signal.reactions = [active_reaction];
          } else if (!includes.call(reactions, active_reaction)) {
            reactions.push(active_reaction);
          }
        }
      }
    }
    if (is_destroying_effect && old_values.has(signal)) {
      return old_values.get(signal);
    }
    if (is_derived) {
      var derived2 = (
        /** @type {Derived} */
        signal
      );
      if (is_destroying_effect) {
        var value = derived2.v;
        if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
          value = execute_derived(derived2);
        }
        old_values.set(derived2, value);
        return value;
      }
      var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (is_updating_effect || (active_reaction.f & CONNECTED) !== 0);
      var is_new = (derived2.f & REACTION_RAN) === 0;
      if (is_dirty(derived2)) {
        if (should_connect) {
          derived2.f |= CONNECTED;
        }
        update_derived(derived2);
      }
      if (should_connect && !is_new) {
        unfreeze_derived_effects(derived2);
        reconnect(derived2);
      }
    }
    if (batch_values?.has(signal)) {
      return batch_values.get(signal);
    }
    if ((signal.f & ERROR_VALUE) !== 0) {
      throw signal.v;
    }
    return signal.v;
  }
  function reconnect(derived2) {
    derived2.f |= CONNECTED;
    if (derived2.deps === null) return;
    for (const dep of derived2.deps) {
      (dep.reactions ?? (dep.reactions = [])).push(derived2);
      if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
        unfreeze_derived_effects(
          /** @type {Derived} */
          dep
        );
        reconnect(
          /** @type {Derived} */
          dep
        );
      }
    }
  }
  function depends_on_old_values(derived2) {
    if (derived2.v === UNINITIALIZED) return true;
    if (derived2.deps === null) return false;
    for (const dep of derived2.deps) {
      if (old_values.has(dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
        /** @type {Derived} */
        dep
      )) {
        return true;
      }
    }
    return false;
  }
  function untrack(fn) {
    var previous_untracking = untracking;
    try {
      untracking = true;
      return fn();
    } finally {
      untracking = previous_untracking;
    }
  }
  const PASSIVE_EVENTS = ["touchstart", "touchmove"];
  function is_passive_event(name) {
    return PASSIVE_EVENTS.includes(name);
  }
  const event_symbol = Symbol("events");
  const all_registered_events = /* @__PURE__ */ new Set();
  const root_event_handles = /* @__PURE__ */ new Set();
  function create_event(event_name, dom, handler, options = {}) {
    function target_handler(event2) {
      if (!options.capture) {
        handle_event_propagation.call(dom, event2);
      }
      if (!event2.cancelBubble) {
        return without_reactive_context(() => {
          return handler?.call(this, event2);
        });
      }
    }
    if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
      target_handler.__removed = false;
      queue_micro_task(() => {
        if (!target_handler.__removed) {
          dom.addEventListener(event_name, target_handler, options);
        }
      });
    } else {
      dom.addEventListener(event_name, target_handler, options);
    }
    return target_handler;
  }
  function event(event_name, dom, handler, capture2, passive) {
    var options = { capture: capture2, passive };
    var target_handler = create_event(event_name, dom, handler, options);
    if (dom === document.body || // @ts-ignore
    dom === window || // @ts-ignore
    dom === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
    dom instanceof HTMLMediaElement) {
      teardown(() => {
        target_handler.__removed = true;
        dom.removeEventListener(event_name, target_handler, options);
      });
    }
  }
  function delegated(event_name, element, handler) {
    (element[event_symbol] ?? (element[event_symbol] = {}))[event_name] = handler;
  }
  function delegate(events) {
    for (var i = 0; i < events.length; i++) {
      all_registered_events.add(events[i]);
    }
    for (var fn of root_event_handles) {
      fn(events);
    }
  }
  let last_propagated_event = null;
  let last_propagated_event_clear_scheduled = false;
  function handle_event_propagation(event2) {
    var handler_element = this;
    var owner_document = (
      /** @type {Node} */
      handler_element.ownerDocument
    );
    var event_name = event2.type;
    var path = event2.composedPath?.() || [];
    var current_target = (
      /** @type {null | Element} */
      path[0] || event2.target
    );
    last_propagated_event = event2;
    if (!last_propagated_event_clear_scheduled) {
      last_propagated_event_clear_scheduled = true;
      setTimeout(() => {
        last_propagated_event_clear_scheduled = false;
        last_propagated_event = null;
      });
    }
    var path_idx = 0;
    var handled_at = last_propagated_event === event2 && event2[event_symbol];
    if (handled_at) {
      var at_idx = path.indexOf(handled_at);
      if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
      window)) {
        event2[event_symbol] = handler_element;
        return;
      }
      var handler_idx = path.indexOf(handler_element);
      if (handler_idx === -1) {
        return;
      }
      if (at_idx <= handler_idx) {
        path_idx = at_idx;
      }
    }
    current_target = /** @type {Element} */
    path[path_idx] || event2.target;
    if (current_target === handler_element) return;
    define_property(event2, "currentTarget", {
      configurable: true,
      get() {
        return current_target || owner_document;
      }
    });
    var previous_reaction = active_reaction;
    var previous_effect = active_effect;
    set_active_reaction(null);
    set_active_effect(null);
    try {
      var throw_error;
      var other_errors = [];
      while (current_target !== null) {
        if (current_target === handler_element) break;
        try {
          var delegated2 = current_target[event_symbol]?.[event_name];
          if (delegated2 != null && (!/** @type {any} */
          current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          event2.target === current_target)) {
            delegated2.call(current_target, event2);
          }
        } catch (error) {
          if (throw_error) {
            other_errors.push(error);
          } else {
            throw_error = error;
          }
        }
        if (event2.cancelBubble) break;
        path_idx++;
        current_target = path_idx < path.length ? (
          /** @type {Element} */
          path[path_idx]
        ) : null;
      }
      if (throw_error) {
        for (let error of other_errors) {
          queueMicrotask(() => {
            throw error;
          });
        }
        throw throw_error;
      }
    } finally {
      event2[event_symbol] = handler_element;
      delete event2.currentTarget;
      set_active_reaction(previous_reaction);
      set_active_effect(previous_effect);
    }
  }
  const policy = (
    // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
    globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
      /** @param {string} html */
      createHTML: (html) => {
        return html;
      }
    })
  );
  function create_trusted_html(html) {
    return (
      /** @type {string} */
      policy?.createHTML(html) ?? html
    );
  }
  function create_fragment_from_html(html) {
    var elem = create_element("template");
    elem.innerHTML = create_trusted_html(html.replaceAll("<!>", "<!---->"));
    return elem.content;
  }
  function assign_nodes(start, end) {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (effect2.nodes === null) {
      effect2.nodes = { start, end, a: null, t: null };
    }
  }
  // @__NO_SIDE_EFFECTS__
  function from_html(content, flags2) {
    var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
    var use_import_node = (flags2 & TEMPLATE_USE_IMPORT_NODE) !== 0;
    var node;
    var has_start = !content.startsWith("<!>");
    return () => {
      if (node === void 0) {
        node = create_fragment_from_html(has_start ? content : "<!>" + content);
        if (!is_fragment) node = /** @type {TemplateNode} */
        /* @__PURE__ */ get_first_child(node);
      }
      var clone = (
        /** @type {TemplateNode} */
        use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          /* @__PURE__ */ get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  // @__NO_SIDE_EFFECTS__
  function from_namespace(content, flags2, ns = "svg") {
    var has_start = !content.startsWith("<!>");
    var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
    var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
    var node;
    return () => {
      if (!node) {
        var fragment = (
          /** @type {DocumentFragment} */
          create_fragment_from_html(wrapped)
        );
        var root2 = (
          /** @type {Element} */
          /* @__PURE__ */ get_first_child(fragment)
        );
        if (is_fragment) {
          node = document.createDocumentFragment();
          while (/* @__PURE__ */ get_first_child(root2)) {
            node.appendChild(
              /** @type {TemplateNode} */
              /* @__PURE__ */ get_first_child(root2)
            );
          }
        } else {
          node = /** @type {Element} */
          /* @__PURE__ */ get_first_child(root2);
        }
      }
      var clone = (
        /** @type {TemplateNode} */
        node.cloneNode(true)
      );
      if (is_fragment) {
        var start = (
          /** @type {TemplateNode} */
          /* @__PURE__ */ get_first_child(clone)
        );
        var end = (
          /** @type {TemplateNode} */
          clone.lastChild
        );
        assign_nodes(start, end);
      } else {
        assign_nodes(clone, clone);
      }
      return clone;
    };
  }
  // @__NO_SIDE_EFFECTS__
  function from_svg(content, flags2) {
    return /* @__PURE__ */ from_namespace(content, flags2, "svg");
  }
  function text(value = "") {
    {
      var t = create_text(value + "");
      assign_nodes(t, t);
      return t;
    }
  }
  function comment() {
    var frag = document.createDocumentFragment();
    var start = document.createComment("");
    var anchor = create_text();
    frag.append(start, anchor);
    assign_nodes(start, anchor);
    return frag;
  }
  function append(anchor, dom) {
    if (anchor === null) {
      return;
    }
    anchor.before(
      /** @type {Node} */
      dom
    );
  }
  function createSubscriber(start) {
    let subscribers = 0;
    let version = source(0);
    let stop;
    return () => {
      if (effect_tracking()) {
        get(version);
        render_effect(() => {
          if (subscribers === 0) {
            stop = untrack(() => start(() => increment(version)));
          }
          subscribers += 1;
          return () => {
            queue_micro_task(() => {
              subscribers -= 1;
              if (subscribers === 0) {
                stop?.();
                stop = void 0;
                increment(version);
              }
            });
          };
        });
      }
    };
  }
  var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
  function boundary(node, props, children, transform_error) {
    new Boundary(node, props, children, transform_error);
  }
  class Boundary {
    /**
     * @param {TemplateNode} node
     * @param {BoundaryProps} props
     * @param {((anchor: Node) => void)} children
     * @param {((error: unknown) => unknown) | undefined} [transform_error]
     */
    constructor(node, props, children, transform_error) {
      __privateAdd(this, _Boundary_instances);
      /** @type {Boundary | null} */
      __publicField(this, "parent");
      __publicField(this, "is_pending", false);
      /**
       * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
       * Inherited from parent boundary, or defaults to identity.
       * @type {(error: unknown) => unknown}
       */
      __publicField(this, "transform_error");
      /** @type {TemplateNode} */
      __privateAdd(this, _anchor);
      /** @type {TemplateNode | null} */
      __privateAdd(this, _hydrate_open, null);
      /** @type {BoundaryProps} */
      __privateAdd(this, _props);
      /** @type {((anchor: Node) => void)} */
      __privateAdd(this, _children);
      /** @type {Effect} */
      __privateAdd(this, _effect);
      /** @type {Effect | null} */
      __privateAdd(this, _main_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _pending_effect, null);
      /** @type {Effect | null} */
      __privateAdd(this, _failed_effect, null);
      /** @type {DocumentFragment | null} */
      __privateAdd(this, _offscreen_fragment, null);
      __privateAdd(this, _local_pending_count, 0);
      __privateAdd(this, _pending_count, 0);
      __privateAdd(this, _pending_count_update_queued, false);
      /** @type {Set<Effect>} */
      __privateAdd(this, _dirty_effects2, /* @__PURE__ */ new Set());
      /** @type {Set<Effect>} */
      __privateAdd(this, _maybe_dirty_effects2, /* @__PURE__ */ new Set());
      /**
       * A source containing the number of pending async deriveds/expressions.
       * Only created if `$effect.pending()` is used inside the boundary,
       * otherwise updating the source results in needless `Batch.ensure()`
       * calls followed by no-op flushes
       * @type {Source<number> | null}
       */
      __privateAdd(this, _effect_pending, null);
      __privateAdd(this, _effect_pending_subscriber, createSubscriber(() => {
        __privateSet(this, _effect_pending, source(__privateGet(this, _local_pending_count)));
        return () => {
          __privateSet(this, _effect_pending, null);
        };
      }));
      __privateSet(this, _anchor, node);
      __privateSet(this, _props, props);
      __privateSet(this, _children, (anchor) => {
        var effect2 = (
          /** @type {Effect} */
          active_effect
        );
        effect2.b = this;
        effect2.f |= BOUNDARY_EFFECT;
        children(anchor);
      });
      this.parent = /** @type {Effect} */
      active_effect.b;
      this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
      __privateSet(this, _effect, block(() => {
        {
          __privateMethod(this, _Boundary_instances, render_fn).call(this);
        }
      }, flags));
    }
    /**
     * Defer an effect inside a pending boundary until the boundary resolves
     * @param {Effect} effect
     */
    defer_effect(effect2) {
      defer_effect(effect2, __privateGet(this, _dirty_effects2), __privateGet(this, _maybe_dirty_effects2));
    }
    /**
     * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
     * @returns {boolean}
     */
    is_rendered() {
      return !this.is_pending && (!this.parent || this.parent.is_rendered());
    }
    has_pending_snippet() {
      return !!__privateGet(this, _props).pending;
    }
    /**
     * Update the source that powers `$effect.pending()` inside this boundary,
     * and controls when the current `pending` snippet (if any) is removed.
     * Do not call from inside the class
     * @param {1 | -1} d
     * @param {Batch} batch
     */
    update_pending_count(d, batch) {
      __privateMethod(this, _Boundary_instances, update_pending_count_fn).call(this, d, batch);
      __privateSet(this, _local_pending_count, __privateGet(this, _local_pending_count) + d);
      if (!__privateGet(this, _effect_pending) || __privateGet(this, _pending_count_update_queued)) return;
      __privateSet(this, _pending_count_update_queued, true);
      queue_micro_task(() => {
        __privateSet(this, _pending_count_update_queued, false);
        if (__privateGet(this, _effect_pending)) {
          internal_set(__privateGet(this, _effect_pending), __privateGet(this, _local_pending_count));
        }
      });
    }
    get_effect_pending() {
      __privateGet(this, _effect_pending_subscriber).call(this);
      return get(
        /** @type {Source<number>} */
        __privateGet(this, _effect_pending)
      );
    }
    /** @param {unknown} error */
    error(error) {
      if (!__privateGet(this, _props).onerror && !__privateGet(this, _props).failed) {
        throw error;
      }
      if (current_batch?.is_fork) {
        if (__privateGet(this, _main_effect)) current_batch.skip_effect(__privateGet(this, _main_effect));
        if (__privateGet(this, _pending_effect)) current_batch.skip_effect(__privateGet(this, _pending_effect));
        if (__privateGet(this, _failed_effect)) current_batch.skip_effect(__privateGet(this, _failed_effect));
        current_batch.oncommit(() => {
          __privateMethod(this, _Boundary_instances, handle_error_fn).call(this, error);
        });
      } else {
        __privateMethod(this, _Boundary_instances, handle_error_fn).call(this, error);
      }
    }
  }
  _anchor = new WeakMap();
  _hydrate_open = new WeakMap();
  _props = new WeakMap();
  _children = new WeakMap();
  _effect = new WeakMap();
  _main_effect = new WeakMap();
  _pending_effect = new WeakMap();
  _failed_effect = new WeakMap();
  _offscreen_fragment = new WeakMap();
  _local_pending_count = new WeakMap();
  _pending_count = new WeakMap();
  _pending_count_update_queued = new WeakMap();
  _dirty_effects2 = new WeakMap();
  _maybe_dirty_effects2 = new WeakMap();
  _effect_pending = new WeakMap();
  _effect_pending_subscriber = new WeakMap();
  _Boundary_instances = new WeakSet();
  hydrate_resolved_content_fn = function() {
    try {
      __privateSet(this, _main_effect, branch(() => __privateGet(this, _children).call(this, __privateGet(this, _anchor))));
    } catch (error) {
      this.error(error);
    }
  };
  /**
   * @param {unknown} error The deserialized error from the server's hydration comment
   */
  hydrate_failed_content_fn = function(error) {
    const failed = __privateGet(this, _props).failed;
    const { reset, invoke_onerror } = __privateMethod(this, _Boundary_instances, create_reset_fn).call(this, error);
    queue_micro_task(invoke_onerror);
    if (!failed) return;
    __privateSet(this, _failed_effect, branch(() => {
      failed(
        __privateGet(this, _anchor),
        () => error,
        () => reset
      );
    }));
  };
  /**
   * Creates the `reset` function for a failed boundary, along with a function
   * that invokes `onerror` with it (if provided)
   * @param {unknown} error
   * @returns {{ reset: () => void, invoke_onerror: () => void }}
   */
  create_reset_fn = function(error) {
    var did_reset = false;
    var calling_on_error = false;
    const reset = () => {
      if (did_reset) {
        svelte_boundary_reset_noop();
        return;
      }
      did_reset = true;
      if (calling_on_error) {
        svelte_boundary_reset_onerror();
      }
      if (__privateGet(this, _failed_effect) !== null) {
        pause_effect(__privateGet(this, _failed_effect), () => {
          __privateSet(this, _failed_effect, null);
        });
      }
      __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
        __privateMethod(this, _Boundary_instances, render_fn).call(this);
      });
    };
    const invoke_onerror = () => {
      try {
        calling_on_error = true;
        __privateGet(this, _props).onerror?.(error, reset);
        calling_on_error = false;
      } catch (err) {
        invoke_error_boundary(err, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
      }
    };
    return { reset, invoke_onerror };
  };
  hydrate_pending_content_fn = function() {
    const pending = __privateGet(this, _props).pending;
    if (!pending) return;
    this.is_pending = true;
    __privateSet(this, _pending_effect, branch(() => pending(__privateGet(this, _anchor))));
    queue_micro_task(() => {
      var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
      var anchor = create_text();
      var handled = false;
      fragment.append(anchor);
      __privateSet(this, _main_effect, __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
        try {
          return branch(() => __privateGet(this, _children).call(this, anchor));
        } catch (error) {
          try {
            this.error(error);
            handled = true;
          } catch (error2) {
            invoke_error_boundary(error2, __privateGet(this, _effect).parent);
          }
          return null;
        }
      }));
      if (__privateGet(this, _main_effect) === null) {
        __privateSet(this, _offscreen_fragment, null);
        if (handled) __privateMethod(this, _Boundary_instances, resolve_fn2).call(
          this,
          /** @type {Batch} */
          current_batch
        );
        return;
      }
      if (__privateGet(this, _pending_count) === 0) {
        __privateGet(this, _anchor).before(fragment);
        __privateSet(this, _offscreen_fragment, null);
        pause_effect(
          /** @type {Effect} */
          __privateGet(this, _pending_effect),
          () => {
            __privateSet(this, _pending_effect, null);
          }
        );
        __privateMethod(this, _Boundary_instances, resolve_fn2).call(
          this,
          /** @type {Batch} */
          current_batch
        );
      }
    });
  };
  render_fn = function() {
    try {
      this.is_pending = this.has_pending_snippet();
      __privateSet(this, _pending_count, 0);
      __privateSet(this, _local_pending_count, 0);
      __privateSet(this, _main_effect, branch(() => {
        __privateGet(this, _children).call(this, __privateGet(this, _anchor));
      }));
      if (__privateGet(this, _pending_count) > 0) {
        var fragment = __privateSet(this, _offscreen_fragment, document.createDocumentFragment());
        move_effect(__privateGet(this, _main_effect), fragment);
        const pending = (
          /** @type {(anchor: Node) => void} */
          __privateGet(this, _props).pending
        );
        __privateSet(this, _pending_effect, branch(() => pending(__privateGet(this, _anchor))));
      } else {
        __privateMethod(this, _Boundary_instances, resolve_fn2).call(
          this,
          /** @type {Batch} */
          current_batch
        );
      }
    } catch (error) {
      this.error(error);
    }
  };
  /**
   * @param {Batch} batch
   */
  resolve_fn2 = function(batch) {
    this.is_pending = false;
    batch.transfer_effects(__privateGet(this, _dirty_effects2), __privateGet(this, _maybe_dirty_effects2));
  };
  /**
   * @template T
   * @param {() => T} fn
   */
  run_fn = function(fn) {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_ctx = component_context;
    set_active_effect(__privateGet(this, _effect));
    set_active_reaction(__privateGet(this, _effect));
    set_component_context(__privateGet(this, _effect).ctx);
    try {
      Batch.ensure();
      return fn();
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  };
  /**
   * Updates the pending count associated with the currently visible pending snippet,
   * if any, such that we can replace the snippet with content once work is done
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count_fn = function(d, batch) {
    var _a2;
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        __privateMethod(_a2 = this.parent, _Boundary_instances, update_pending_count_fn).call(_a2, d, batch);
      }
      return;
    }
    __privateSet(this, _pending_count, __privateGet(this, _pending_count) + d);
    if (__privateGet(this, _pending_count) === 0) {
      __privateMethod(this, _Boundary_instances, resolve_fn2).call(this, batch);
      if (__privateGet(this, _pending_effect)) {
        pause_effect(__privateGet(this, _pending_effect), () => {
          __privateSet(this, _pending_effect, null);
        });
      }
      if (__privateGet(this, _offscreen_fragment)) {
        __privateGet(this, _anchor).before(__privateGet(this, _offscreen_fragment));
        __privateSet(this, _offscreen_fragment, null);
      }
    }
  };
  /**
   * @param {unknown} error
   */
  handle_error_fn = function(error) {
    if (__privateGet(this, _main_effect)) {
      destroy_effect(__privateGet(this, _main_effect));
      __privateSet(this, _main_effect, null);
    }
    if (__privateGet(this, _pending_effect)) {
      destroy_effect(__privateGet(this, _pending_effect));
      __privateSet(this, _pending_effect, null);
    }
    if (__privateGet(this, _failed_effect)) {
      destroy_effect(__privateGet(this, _failed_effect));
      __privateSet(this, _failed_effect, null);
    }
    let failed = __privateGet(this, _props).failed;
    const handle_error_result = (transformed_error) => {
      const { reset, invoke_onerror } = __privateMethod(this, _Boundary_instances, create_reset_fn).call(this, transformed_error);
      invoke_onerror();
      if (failed) {
        __privateSet(this, _failed_effect, __privateMethod(this, _Boundary_instances, run_fn).call(this, () => {
          try {
            return branch(() => {
              var effect2 = (
                /** @type {Effect} */
                active_effect
              );
              effect2.b = this;
              effect2.f |= BOUNDARY_EFFECT;
              failed(
                __privateGet(this, _anchor),
                () => transformed_error,
                () => reset
              );
            });
          } catch (error2) {
            invoke_error_boundary(
              error2,
              /** @type {Effect} */
              __privateGet(this, _effect).parent
            );
            return null;
          }
        }));
      }
    };
    queue_micro_task(() => {
      var result;
      try {
        result = this.transform_error(error);
      } catch (e) {
        invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent);
        return;
      }
      if (result !== null && typeof result === "object" && typeof /** @type {any} */
      result.then === "function") {
        result.then(
          handle_error_result,
          /** @param {unknown} e */
          (e) => invoke_error_boundary(e, __privateGet(this, _effect) && __privateGet(this, _effect).parent)
        );
      } else {
        handle_error_result(result);
      }
    });
  };
  function set_text(text2, value) {
    var str = value == null ? "" : typeof value === "object" ? `${value}` : value;
    if (str !== /** @type {any} */
    (text2[TEXT_CACHE] ?? (text2[TEXT_CACHE] = text2.nodeValue))) {
      text2[TEXT_CACHE] = str;
      text2.nodeValue = `${str}`;
    }
  }
  function mount(component, options) {
    return _mount(component, options);
  }
  const listeners = /* @__PURE__ */ new Map();
  function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
    init_operations();
    var component = void 0;
    var unmount = component_root(() => {
      var anchor_node = anchor ?? target.appendChild(create_text());
      boundary(
        /** @type {TemplateNode} */
        anchor_node,
        {
          pending: () => {
          }
        },
        (anchor_node2) => {
          push({});
          var ctx = (
            /** @type {ComponentContext} */
            component_context
          );
          if (context) ctx.c = context;
          if (events) {
            props.$$events = events;
          }
          component = Component(anchor_node2, props) || mark_as_component();
          pop();
        },
        transformError
      );
      var registered_events = /* @__PURE__ */ new Set();
      var event_handle = (events2) => {
        for (var i = 0; i < events2.length; i++) {
          var event_name = events2[i];
          if (registered_events.has(event_name)) continue;
          registered_events.add(event_name);
          var passive = is_passive_event(event_name);
          for (const node of [target, document]) {
            var counts = listeners.get(node);
            if (counts === void 0) {
              counts = /* @__PURE__ */ new Map();
              listeners.set(node, counts);
            }
            var count = counts.get(event_name);
            if (count === void 0) {
              node.addEventListener(event_name, handle_event_propagation, { passive });
              counts.set(event_name, 1);
            } else {
              counts.set(event_name, count + 1);
            }
          }
        }
      };
      event_handle(array_from(all_registered_events));
      root_event_handles.add(event_handle);
      return () => {
        for (var event_name of registered_events) {
          for (const node of [target, document]) {
            var counts = (
              /** @type {Map<string, number>} */
              listeners.get(node)
            );
            var count = (
              /** @type {number} */
              counts.get(event_name)
            );
            if (--count == 0) {
              node.removeEventListener(event_name, handle_event_propagation);
              counts.delete(event_name);
              if (counts.size === 0) {
                listeners.delete(node);
              }
            } else {
              counts.set(event_name, count);
            }
          }
        }
        root_event_handles.delete(event_handle);
        if (anchor_node !== anchor) {
          anchor_node.parentNode?.removeChild(anchor_node);
        }
      };
    });
    mounted_components.set(component, unmount);
    return component;
  }
  let mounted_components = /* @__PURE__ */ new WeakMap();
  class BranchManager {
    /**
     * @param {TemplateNode} anchor
     * @param {boolean} transition
     */
    constructor(anchor, transition = true) {
      /** @type {TemplateNode} */
      __publicField(this, "anchor");
      /** @type {Map<Batch, Key>} */
      __privateAdd(this, _batches, /* @__PURE__ */ new Map());
      /**
       * Map of keys to effects that are currently rendered in the DOM.
       * These effects are visible and actively part of the document tree.
       * Example:
       * ```
       * {#if condition}
       * 	foo
       * {:else}
       * 	bar
       * {/if}
       * ```
       * Can result in the entries `true->Effect` and `false->Effect`
       * @type {Map<Key, Effect>}
       */
      __privateAdd(this, _onscreen, /* @__PURE__ */ new Map());
      /**
       * Similar to #onscreen with respect to the keys, but contains branches that are not yet
       * in the DOM, because their insertion is deferred.
       * @type {Map<Key, Branch>}
       */
      __privateAdd(this, _offscreen, /* @__PURE__ */ new Map());
      /**
       * Keys of effects that are currently outroing
       * @type {Set<Key>}
       */
      __privateAdd(this, _outroing, /* @__PURE__ */ new Set());
      /**
       * Whether to pause (i.e. outro) on change, or destroy immediately.
       * This is necessary for `<svelte:element>`
       */
      __privateAdd(this, _transition, true);
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _commit, (batch) => {
        if (!__privateGet(this, _batches).has(batch)) return;
        var key = (
          /** @type {Key} */
          __privateGet(this, _batches).get(batch)
        );
        var onscreen = __privateGet(this, _onscreen).get(key);
        if (onscreen) {
          resume_effect(onscreen);
          __privateGet(this, _outroing).delete(key);
        } else {
          var offscreen = __privateGet(this, _offscreen).get(key);
          if (offscreen) {
            resume_effect(offscreen.effect);
            __privateGet(this, _onscreen).set(key, offscreen.effect);
            __privateGet(this, _offscreen).delete(key);
            offscreen.fragment.lastChild.remove();
            this.anchor.before(offscreen.fragment);
            onscreen = offscreen.effect;
          }
        }
        for (const [b, k] of __privateGet(this, _batches)) {
          __privateGet(this, _batches).delete(b);
          if (b === batch) {
            break;
          }
          const offscreen2 = __privateGet(this, _offscreen).get(k);
          if (offscreen2) {
            destroy_effect(offscreen2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key || __privateGet(this, _outroing).has(k)) continue;
          const on_destroy = () => {
            const keys = Array.from(__privateGet(this, _batches).values());
            if (keys.includes(k)) {
              var fragment = document.createDocumentFragment();
              move_effect(effect2, fragment);
              fragment.append(create_text());
              __privateGet(this, _offscreen).set(k, { effect: effect2, fragment });
            } else {
              destroy_effect(effect2);
            }
            __privateGet(this, _outroing).delete(k);
            __privateGet(this, _onscreen).delete(k);
          };
          if (__privateGet(this, _transition) || !onscreen) {
            __privateGet(this, _outroing).add(k);
            pause_effect(effect2, on_destroy, false);
          } else {
            on_destroy();
          }
        }
      });
      /**
       * @param {Batch} batch
       */
      __privateAdd(this, _discard, (batch) => {
        __privateGet(this, _batches).delete(batch);
        const keys = Array.from(__privateGet(this, _batches).values());
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (!keys.includes(k)) {
            destroy_effect(branch2.effect);
            __privateGet(this, _offscreen).delete(k);
          }
        }
      });
      this.anchor = anchor;
      __privateSet(this, _transition, transition);
    }
    /**
     *
     * @param {any} key
     * @param {null | ((target: TemplateNode) => void)} fn
     */
    ensure(key, fn) {
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      if (fn && !__privateGet(this, _onscreen).has(key) && !__privateGet(this, _offscreen).has(key)) {
        if (defer) {
          var fragment = document.createDocumentFragment();
          var target = create_text();
          fragment.append(target);
          __privateGet(this, _offscreen).set(key, {
            effect: branch(() => fn(target)),
            fragment
          });
        } else {
          __privateGet(this, _onscreen).set(
            key,
            branch(() => fn(this.anchor))
          );
        }
      }
      __privateGet(this, _batches).set(batch, key);
      if (defer) {
        for (const [k, effect2] of __privateGet(this, _onscreen)) {
          if (k === key) {
            batch.unskip_effect(effect2);
          } else {
            batch.skip_effect(effect2);
          }
        }
        for (const [k, branch2] of __privateGet(this, _offscreen)) {
          if (k === key) {
            batch.unskip_effect(branch2.effect);
          } else {
            batch.skip_effect(branch2.effect);
          }
        }
        batch.oncommit(__privateGet(this, _commit));
        batch.ondiscard(__privateGet(this, _discard));
      } else {
        __privateGet(this, _commit).call(this, batch);
      }
    }
  }
  _batches = new WeakMap();
  _onscreen = new WeakMap();
  _offscreen = new WeakMap();
  _outroing = new WeakMap();
  _transition = new WeakMap();
  _commit = new WeakMap();
  _discard = new WeakMap();
  function if_block(node, fn, elseif = false) {
    var branches = new BranchManager(node);
    var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
    function update_branch(key, fn2) {
      branches.ensure(key, fn2);
    }
    block(() => {
      var has_branch = false;
      fn((fn2, key = 0) => {
        has_branch = true;
        update_branch(key, fn2);
      });
      if (!has_branch) {
        update_branch(-1, null);
      }
    }, flags2);
  }
  function pause_effects(state2, to_destroy, controlled_anchor) {
    var transitions = [];
    var length = to_destroy.length;
    var group;
    var remaining = to_destroy.length;
    for (var i = 0; i < length; i++) {
      let effect2 = to_destroy[i];
      pause_effect(
        effect2,
        () => {
          if (group) {
            group.pending.delete(effect2);
            group.done.add(effect2);
            if (group.pending.size === 0) {
              var groups = (
                /** @type {Set<EachOutroGroup>} */
                state2.outrogroups
              );
              destroy_effects(state2, array_from(group.done));
              groups.delete(group);
              if (groups.size === 0) {
                state2.outrogroups = null;
              }
            }
          } else {
            remaining -= 1;
          }
        },
        false
      );
    }
    if (remaining === 0) {
      var fast_path = transitions.length === 0 && controlled_anchor !== null && state2.pending.size === 0;
      if (fast_path) {
        var anchor = (
          /** @type {Element} */
          controlled_anchor
        );
        var parent_node = (
          /** @type {Element} */
          anchor.parentNode
        );
        clear_text_content(parent_node);
        parent_node.append(anchor);
        state2.items.clear();
      }
      destroy_effects(state2, to_destroy, !fast_path);
    } else {
      group = {
        pending: new Set(to_destroy),
        done: /* @__PURE__ */ new Set()
      };
      (state2.outrogroups ?? (state2.outrogroups = /* @__PURE__ */ new Set())).add(group);
    }
  }
  function destroy_effects(state2, to_destroy, remove_dom = true) {
    var preserved_effects;
    if (state2.pending.size > 0) {
      preserved_effects = /* @__PURE__ */ new Set();
      for (const keys of state2.pending.values()) {
        for (const key of keys) {
          preserved_effects.add(
            /** @type {EachItem} */
            state2.items.get(key).e
          );
        }
      }
    }
    for (var i = 0; i < to_destroy.length; i++) {
      var e = to_destroy[i];
      if (preserved_effects?.has(e)) {
        e.f |= EFFECT_OFFSCREEN;
        const fragment = document.createDocumentFragment();
        move_effect(e, fragment);
      } else {
        destroy_effect(to_destroy[i], remove_dom);
      }
    }
  }
  var offscreen_anchor;
  function each(node, flags2, get_collection, get_key, render_fn2, fallback_fn = null) {
    var anchor = node;
    var items = /* @__PURE__ */ new Map();
    var is_controlled = (flags2 & EACH_IS_CONTROLLED) !== 0;
    if (is_controlled) {
      var parent_node = (
        /** @type {Element} */
        node
      );
      anchor = parent_node.appendChild(create_text());
    }
    var fallback = null;
    var each_array = /* @__PURE__ */ derived_safe_equal(() => {
      var collection = get_collection();
      return (
        /** @type {V[]} */
        is_array(collection) ? collection : collection == null ? [] : array_from(collection)
      );
    });
    var array;
    var pending = /* @__PURE__ */ new Map();
    var first_run = true;
    function commit(batch) {
      if ((state2.effect.f & DESTROYED) !== 0) {
        return;
      }
      state2.pending.delete(batch);
      state2.fallback = fallback;
      reconcile(state2, array, anchor, flags2, get_key);
      if (fallback !== null) {
        if (array.length === 0) {
          if ((fallback.f & EFFECT_OFFSCREEN) === 0) {
            resume_effect(fallback);
          } else {
            fallback.f ^= EFFECT_OFFSCREEN;
            move(fallback, null, anchor);
          }
        } else {
          pause_effect(fallback, () => {
            fallback = null;
          });
        }
      }
    }
    function discard(batch) {
      state2.pending.delete(batch);
    }
    var effect2 = block(() => {
      array = /** @type {V[]} */
      get(each_array);
      var length = array.length;
      var keys = /* @__PURE__ */ new Set();
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var defer = should_defer_append();
      for (var index = 0; index < length; index += 1) {
        var value = array[index];
        var key = get_key(value, index);
        var item = first_run ? null : items.get(key);
        if (item) {
          if (item.v) internal_set(item.v, value);
          if (item.i) internal_set(item.i, index);
          if (defer) {
            batch.unskip_effect(item.e);
          }
        } else {
          item = create_item(
            items,
            first_run ? anchor : offscreen_anchor ?? (offscreen_anchor = create_text()),
            value,
            key,
            index,
            render_fn2,
            flags2,
            get_collection
          );
          if (!first_run) {
            item.e.f |= EFFECT_OFFSCREEN;
          }
          items.set(key, item);
        }
        keys.add(key);
      }
      if (length === 0 && fallback_fn && !fallback) {
        if (first_run) {
          fallback = branch(() => fallback_fn(anchor));
        } else {
          fallback = branch(() => fallback_fn(offscreen_anchor ?? (offscreen_anchor = create_text())));
          fallback.f |= EFFECT_OFFSCREEN;
        }
      }
      if (length > keys.size) {
        {
          each_key_duplicate();
        }
      }
      if (!first_run) {
        pending.set(batch, keys);
        if (defer) {
          for (const [key2, item2] of items) {
            if (!keys.has(key2)) {
              batch.skip_effect(item2.e);
            }
          }
          batch.oncommit(commit);
          batch.ondiscard(discard);
        } else {
          commit(batch);
        }
      }
      get(each_array);
    });
    var state2 = { effect: effect2, items, pending, outrogroups: null, fallback };
    first_run = false;
  }
  function skip_to_branch(effect2) {
    while (effect2 !== null && (effect2.f & BRANCH_EFFECT) === 0) {
      effect2 = effect2.next;
    }
    return effect2;
  }
  function reconcile(state2, array, anchor, flags2, get_key) {
    var is_animated = (flags2 & EACH_IS_ANIMATED) !== 0;
    var length = array.length;
    var items = state2.items;
    var current2 = skip_to_branch(state2.effect.first);
    var seen2;
    var prev = null;
    var to_animate;
    var matched = [];
    var stashed = [];
    var value;
    var key;
    var effect2;
    var i;
    if (is_animated) {
      for (i = 0; i < length; i += 1) {
        value = array[i];
        key = get_key(value, i);
        effect2 = /** @type {EachItem} */
        items.get(key).e;
        if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
          effect2.nodes?.a?.measure();
          (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).add(effect2);
        }
      }
    }
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key = get_key(value, i);
      effect2 = /** @type {EachItem} */
      items.get(key).e;
      if (state2.outrogroups !== null) {
        for (const group of state2.outrogroups) {
          group.pending.delete(effect2);
          group.done.delete(effect2);
        }
      }
      if ((effect2.f & INERT) !== 0) {
        resume_effect(effect2);
        if (is_animated) {
          effect2.nodes?.a?.unfix();
          (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).delete(effect2);
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) !== 0) {
        effect2.f ^= EFFECT_OFFSCREEN;
        if (effect2 === current2) {
          move(effect2, null, anchor);
        } else {
          var next = prev ? prev.next : current2;
          if (effect2 === state2.effect.last) {
            state2.effect.last = effect2.prev;
          }
          if (effect2.prev) effect2.prev.next = effect2.next;
          if (effect2.next) effect2.next.prev = effect2.prev;
          link(state2, prev, effect2);
          link(state2, effect2, next);
          move(effect2, next, anchor);
          prev = effect2;
          matched = [];
          stashed = [];
          current2 = skip_to_branch(prev.next);
          continue;
        }
      }
      if (effect2 !== current2) {
        if (seen2 !== void 0 && seen2.has(effect2)) {
          if (matched.length < stashed.length) {
            var start = stashed[0];
            var j;
            prev = start.prev;
            var a = matched[0];
            var b = matched[matched.length - 1];
            for (j = 0; j < matched.length; j += 1) {
              move(matched[j], start, anchor);
            }
            for (j = 0; j < stashed.length; j += 1) {
              seen2.delete(stashed[j]);
            }
            link(state2, a.prev, b.next);
            link(state2, prev, a);
            link(state2, b, start);
            current2 = start;
            prev = b;
            i -= 1;
            matched = [];
            stashed = [];
          } else {
            seen2.delete(effect2);
            move(effect2, current2, anchor);
            link(state2, effect2.prev, effect2.next);
            link(state2, effect2, prev === null ? state2.effect.first : prev.next);
            link(state2, prev, effect2);
            prev = effect2;
          }
          continue;
        }
        matched = [];
        stashed = [];
        while (current2 !== null && current2 !== effect2) {
          (seen2 ?? (seen2 = /* @__PURE__ */ new Set())).add(current2);
          stashed.push(current2);
          current2 = skip_to_branch(current2.next);
        }
        if (current2 === null) {
          continue;
        }
      }
      if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
        matched.push(effect2);
      }
      prev = effect2;
      current2 = skip_to_branch(effect2.next);
    }
    if (state2.outrogroups !== null) {
      for (const group of state2.outrogroups) {
        if (group.pending.size === 0) {
          destroy_effects(state2, array_from(group.done));
          state2.outrogroups?.delete(group);
        }
      }
      if (state2.outrogroups.size === 0) {
        state2.outrogroups = null;
      }
    }
    if (current2 !== null || seen2 !== void 0) {
      var to_destroy = [];
      if (seen2 !== void 0) {
        for (effect2 of seen2) {
          if ((effect2.f & INERT) === 0) {
            to_destroy.push(effect2);
          }
        }
      }
      while (current2 !== null) {
        if ((current2.f & INERT) === 0 && current2 !== state2.fallback) {
          to_destroy.push(current2);
        }
        current2 = skip_to_branch(current2.next);
      }
      var destroy_length = to_destroy.length;
      if (destroy_length > 0) {
        var controlled_anchor = (flags2 & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
        if (is_animated) {
          for (i = 0; i < destroy_length; i += 1) {
            to_destroy[i].nodes?.a?.measure();
          }
          for (i = 0; i < destroy_length; i += 1) {
            to_destroy[i].nodes?.a?.fix();
          }
        }
        pause_effects(state2, to_destroy, controlled_anchor);
      }
    }
    if (is_animated) {
      queue_micro_task(() => {
        if (to_animate === void 0) return;
        for (effect2 of to_animate) {
          effect2.nodes?.a?.apply();
        }
      });
    }
  }
  function create_item(items, anchor, value, key, index, render_fn2, flags2, get_collection) {
    var v = (flags2 & EACH_ITEM_REACTIVE) !== 0 ? (flags2 & EACH_ITEM_IMMUTABLE) === 0 ? /* @__PURE__ */ mutable_source(value, false, false) : source(value) : null;
    var i = (flags2 & EACH_INDEX_REACTIVE) !== 0 ? source(index) : null;
    return {
      v,
      i,
      e: branch(() => {
        render_fn2(anchor, v ?? value, i ?? index, get_collection);
        return () => {
          items.delete(key);
        };
      })
    };
  }
  function move(effect2, next, anchor) {
    if (!effect2.nodes) return;
    var node = effect2.nodes.start;
    var end = effect2.nodes.end;
    var dest = next && (next.f & EFFECT_OFFSCREEN) === 0 ? (
      /** @type {EffectNodes} */
      next.nodes.start
    ) : anchor;
    while (node !== null) {
      var next_node = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_next_sibling(node)
      );
      dest.before(node);
      if (node === end) {
        return;
      }
      node = next_node;
    }
  }
  function link(state2, prev, next) {
    if (prev === null) {
      state2.effect.first = next;
    } else {
      prev.next = next;
    }
    if (next === null) {
      state2.effect.last = prev;
    } else {
      next.prev = prev;
    }
  }
  function snippet(node, get_snippet, ...args) {
    var branches = new BranchManager(node);
    block(() => {
      const snippet2 = get_snippet() ?? null;
      branches.ensure(snippet2, snippet2 && ((anchor) => snippet2(anchor, ...args)));
    }, EFFECT_TRANSPARENT);
  }
  function r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e) n += e;
    else if ("object" == typeof e) if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else for (f in e) e[f] && (n && (n += " "), n += f);
    return n;
  }
  function clsx$1() {
    for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
    return n;
  }
  function clsx(value) {
    if (typeof value === "object") {
      return clsx$1(value);
    } else {
      return value ?? "";
    }
  }
  const whitespace = [..." 	\n\r\f \v\uFEFF"];
  function to_class(value, hash, directives) {
    var classname = value == null ? "" : "" + value;
    if (hash) {
      classname = classname ? classname + " " + hash : hash;
    }
    if (directives) {
      for (var key of Object.keys(directives)) {
        if (directives[key]) {
          classname = classname ? classname + " " + key : key;
        } else if (classname.length) {
          var len = key.length;
          var a = 0;
          while ((a = classname.indexOf(key, a)) >= 0) {
            var b = a + len;
            if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) {
              classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
            } else {
              a = b;
            }
          }
        }
      }
    }
    return classname === "" ? null : classname;
  }
  function to_style(value, styles) {
    return value == null ? null : String(value);
  }
  function set_class(dom, is_html, value, hash, prev_classes, next_classes) {
    var prev = (
      /** @type {any} */
      dom[CLASS_CACHE]
    );
    if (prev !== value || prev === void 0) {
      var next_class_name = to_class(value, hash, next_classes);
      {
        if (next_class_name == null) {
          dom.removeAttribute("class");
        } else {
          dom.className = next_class_name;
        }
      }
      dom[CLASS_CACHE] = value;
    } else if (next_classes && prev_classes !== next_classes) {
      for (var key in next_classes) {
        var is_present = !!next_classes[key];
        if (prev_classes == null || is_present !== !!prev_classes[key]) {
          dom.classList.toggle(key, is_present);
        }
      }
    }
    return next_classes;
  }
  function set_style(dom, value, prev_styles, next_styles) {
    var prev = (
      /** @type {any} */
      dom[STYLE_CACHE]
    );
    if (prev !== value) {
      var next_style_attr = to_style(value);
      {
        if (next_style_attr == null) {
          dom.removeAttribute("style");
        } else {
          dom.style.cssText = next_style_attr;
        }
      }
      dom[STYLE_CACHE] = value;
    }
    return next_styles;
  }
  function set_selected(option, selected) {
    if (selected) {
      if (!option.hasAttribute("selected")) option.setAttribute("selected", "");
    } else {
      option.removeAttribute("selected");
    }
  }
  function apply_default_select_value(select, preserve) {
    var value = select.__defaultValue;
    var multiple = select.multiple;
    var values = multiple ? value ?? [] : null;
    if (multiple && !is_array(values)) return;
    select.selectedIndex;
    for (var option of select.options) {
      var option_value = get_option_value(option);
      set_selected(
        option,
        multiple ? (
          /** @type {any[]} */
          values.includes(option_value)
        ) : is(option_value, value)
      );
    }
    return;
  }
  function select_option(select, value, mounting = false) {
    if (select.multiple) {
      if (value == void 0) {
        return;
      }
      if (!is_array(value)) {
        return select_multiple_invalid_value();
      }
      for (var option of select.options) {
        option.selected = value.includes(get_option_value(option));
      }
      return;
    }
    for (option of select.options) {
      var option_value = get_option_value(option);
      if (is(option_value, value)) {
        option.selected = true;
        return;
      }
    }
    if (!mounting || value !== void 0) {
      select.selectedIndex = -1;
    }
  }
  function init_select(select) {
    var observer = new MutationObserver((entries) => {
      if (entries.every(is_selectedcontent_mutation)) return;
      if ("__defaultValue" in select) {
        apply_default_select_value(select);
      }
      if ("__value" in select) {
        select_option(select, select.__value);
      }
    });
    observer.observe(select, {
      // Listen to option element changes
      childList: true,
      subtree: true,
      // because of <optgroup>
      // Listen to option element value attribute changes
      // (doesn't get notified of select value changes,
      // because that property is not reflected as an attribute)
      attributes: true,
      attributeFilter: ["value"]
    });
    teardown(() => {
      observer.disconnect();
    });
  }
  function bind_select_value(select, get2, set2 = get2) {
    var batches = /* @__PURE__ */ new WeakSet();
    var mounting = true;
    listen_to_event_and_reset_event(select, "change", (is_reset) => {
      var query = is_reset ? "[selected]" : ":checked";
      var value;
      if (select.multiple) {
        value = [].map.call(select.querySelectorAll(query), get_option_value);
      } else {
        var selected_option = select.querySelector(query) ?? // will fall back to first non-disabled option if no option is selected
        select.querySelector("option:not([disabled])");
        value = selected_option && get_option_value(selected_option);
      }
      set2(value);
      select.__value = value;
      if (current_batch !== null) {
        batches.add(current_batch);
      }
    });
    effect(() => {
      var value = get2();
      if (select === document.activeElement) {
        var batch = (
          /** @type {Batch} */
          current_batch
        );
        if (batches.has(batch)) {
          return;
        }
      }
      select_option(select, value, mounting);
      if (mounting && value === void 0) {
        var selected_option = select.querySelector(":checked");
        if (selected_option !== null) {
          value = get_option_value(selected_option);
          set2(value);
        }
      }
      select.__value = value;
      mounting = false;
    });
  }
  function get_option_value(option) {
    if ("__value" in option) {
      return option.__value;
    } else {
      return option.value;
    }
  }
  function is_selectedcontent_mutation(entry) {
    if (
      /** @type {Element} */
      entry.target.closest("selectedcontent") !== null
    ) {
      return true;
    }
    if (entry.type === "childList") {
      var nodes = [...entry.addedNodes, ...entry.removedNodes];
      return nodes.length > 0 && nodes.every((node) => node.nodeName === "SELECTEDCONTENT");
    }
    return false;
  }
  const IS_CUSTOM_ELEMENT = Symbol("is custom element");
  const IS_HTML = Symbol("is html");
  function set_attribute(element, attribute, value, skip_warning) {
    var attributes = get_attributes(element);
    if (attributes[attribute] === (attributes[attribute] = value)) return;
    if (attribute === "loading") {
      element[LOADING_ATTR_SYMBOL] = value;
    }
    if (value == null) {
      element.removeAttribute(attribute);
    } else if (typeof value !== "string" && get_setters(element).has(attribute)) {
      element[attribute] = value;
    } else {
      element.setAttribute(attribute, value);
    }
  }
  function get_attributes(element) {
    return (
      /** @type {Record<string | symbol, unknown>} **/
      /** @type {any} */
      element[ATTRIBUTES_CACHE] ?? (element[ATTRIBUTES_CACHE] = {
        [IS_CUSTOM_ELEMENT]: element.nodeName.includes("-"),
        [IS_HTML]: element.namespaceURI === NAMESPACE_HTML
      })
    );
  }
  var setters_cache = /* @__PURE__ */ new Map();
  function get_setters(element) {
    var cache_key = element.getAttribute("is") || element.nodeName;
    var setters = setters_cache.get(cache_key);
    if (setters) return setters;
    setters_cache.set(cache_key, setters = /* @__PURE__ */ new Set());
    var descriptors;
    var proto = element;
    var element_proto = Element.prototype;
    while (element_proto !== proto) {
      descriptors = get_descriptors(proto);
      for (var key in descriptors) {
        if (descriptors[key].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
        key !== "innerHTML" && key !== "textContent" && key !== "innerText") {
          setters.add(key);
        }
      }
      proto = get_prototype_of(proto);
    }
    return setters;
  }
  function bind_value(input, get2, set2 = get2) {
    var batches = /* @__PURE__ */ new WeakSet();
    listen_to_event_and_reset_event(input, "input", async (is_reset) => {
      var value = is_reset ? input.defaultValue : input.value;
      value = is_numberlike_input(input) ? to_number(value) : value;
      set2(value);
      if (current_batch !== null) {
        batches.add(current_batch);
      }
      await tick();
      if (value !== (value = get2())) {
        var start = input.selectionStart;
        var end = input.selectionEnd;
        var length = input.value.length;
        input.value = value ?? "";
        if (end !== null) {
          var new_length = input.value.length;
          if (start === end && end === length && new_length > length) {
            input.selectionStart = new_length;
            input.selectionEnd = new_length;
          } else {
            input.selectionStart = start;
            input.selectionEnd = Math.min(end, new_length);
          }
        }
      }
    });
    if (
      // If we are hydrating and the value has since changed,
      // then use the updated value from the input instead.
      // If defaultValue is set, then value == defaultValue
      // TODO Svelte 6: remove input.value check and set to empty string?
      untrack(get2) == null && input.value
    ) {
      set2(is_numberlike_input(input) ? to_number(input.value) : input.value);
      if (current_batch !== null) {
        batches.add(current_batch);
      }
    }
    render_effect(() => {
      var value = get2();
      if (input === document.activeElement) {
        var batch = (
          /** @type {Batch} */
          current_batch
        );
        if (batches.has(batch)) {
          return;
        }
      }
      if (is_numberlike_input(input) && value === to_number(input.value)) {
        return;
      }
      if (input.type === "date" && !value && !input.value) {
        return;
      }
      if (value !== input.value) {
        input.value = value ?? "";
      }
    });
  }
  function is_numberlike_input(input) {
    var type = input.type;
    return type === "number" || type === "range";
  }
  function to_number(value) {
    return value === "" ? null : +value;
  }
  let is_store_binding = false;
  function capture_store_binding(fn) {
    var previous_is_store_binding = is_store_binding;
    try {
      is_store_binding = false;
      return [fn(), is_store_binding];
    } finally {
      is_store_binding = previous_is_store_binding;
    }
  }
  function prop(props, key, flags2, fallback) {
    var runes = true;
    var bindable = (flags2 & PROPS_IS_BINDABLE) !== 0;
    var lazy = (flags2 & PROPS_IS_LAZY_INITIAL) !== 0;
    var fallback_value = (
      /** @type {V} */
      fallback
    );
    var fallback_dirty = true;
    var fallback_signal = (
      /** @type {Derived<V> | undefined} */
      void 0
    );
    var get_fallback = () => {
      if (lazy && runes) {
        fallback_signal ?? (fallback_signal = /* @__PURE__ */ derived(
          /** @type {() => V} */
          fallback
        ));
        return get(fallback_signal);
      }
      if (fallback_dirty) {
        fallback_dirty = false;
        fallback_value = lazy ? untrack(
          /** @type {() => V} */
          fallback
        ) : (
          /** @type {V} */
          fallback
        );
      }
      return fallback_value;
    };
    let setter;
    if (bindable) {
      var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
      setter = get_descriptor(props, key)?.set ?? (is_entry_props && key in props ? (v) => props[key] = v : void 0);
    }
    var initial_value;
    var is_store_sub = false;
    if (bindable) {
      [initial_value, is_store_sub] = capture_store_binding(() => (
        /** @type {V} */
        props[key]
      ));
    } else {
      initial_value = /** @type {V} */
      props[key];
    }
    if (initial_value === void 0 && fallback !== void 0) {
      initial_value = get_fallback();
      if (setter) {
        props_invalid_value();
        setter(initial_value);
      }
    }
    var getter;
    {
      getter = () => {
        var value = (
          /** @type {V} */
          props[key]
        );
        if (value === void 0) return get_fallback();
        fallback_dirty = true;
        return value;
      };
    }
    if ((flags2 & PROPS_IS_UPDATED) === 0) {
      return getter;
    }
    if (setter) {
      var legacy_parent = props.$$legacy;
      return (
        /** @type {() => V} */
        (function(value, mutation) {
          if (arguments.length > 0) {
            if (!mutation || legacy_parent || is_store_sub) {
              setter(mutation ? getter() : value);
            }
            return value;
          }
          return getter();
        })
      );
    }
    var overridden = false;
    var d = ((flags2 & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
      overridden = false;
      return getter();
    });
    if (bindable) get(d);
    var parent_effect = (
      /** @type {Effect} */
      active_effect
    );
    return (
      /** @type {() => V} */
      (function(value, mutation) {
        if (arguments.length > 0) {
          const new_value = mutation ? get(d) : bindable ? proxy(value) : value;
          set(d, new_value);
          overridden = true;
          if (fallback_value !== void 0) {
            fallback_value = new_value;
          }
          return value;
        }
        if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
          return d.v;
        }
        return get(d);
      })
    );
  }
  const PUBLIC_VERSION = "5";
  if (typeof window !== "undefined") {
    ((_a = window.__svelte ?? (window.__svelte = {})).v ?? (_a.v = /* @__PURE__ */ new Set())).add(PUBLIC_VERSION);
  }
  const ENV_STATES = [
    "available",
    "claimed",
    "expiring",
    "releasing",
    "disputed",
    "quarantined"
  ];
  const EMPTY_FLEET = {
    clusters: [],
    environments: [],
    leases: [],
    findings: [],
    policy: null,
    policies: []
  };
  const RESOLUTIONS = [
    {
      id: "force_reclaim",
      label: "Force reclaim",
      blurb: "Destroy whatever is running and return the slot to the pool.",
      destructive: true
    },
    {
      id: "mark_external",
      label: "Mark external",
      blurb: "This workload is legitimately managed elsewhere. Stop alerting; record who vouched for it.",
      destructive: false
    },
    {
      id: "escalate",
      label: "Escalate",
      blurb: "Ownership is unclear. Page the owning team and leave the finding open.",
      destructive: false
    }
  ];
  function rows(r2) {
    if (Array.isArray(r2)) return r2;
    if (r2 && Array.isArray(r2.results)) return r2.results;
    return [];
  }
  async function list(schema) {
    return rows(await client.getObjects(schema));
  }
  async function login(email, password) {
    const cfg2 = window.__SUPERO_CONFIG;
    if (!cfg2) throw new Error("Supero config is not available.");
    await client.login(cfg2.domain, email.trim(), password, cfg2.project, "");
  }
  async function loadFleet() {
    const [clusters, environments, leases, findings, policies] = await Promise.all([
      list("cluster"),
      list("environment"),
      list("lease"),
      list("drift_finding"),
      list("fleet_policy")
    ]);
    return {
      clusters,
      environments,
      leases,
      findings,
      policy: policies[0] ?? null,
      policies
    };
  }
  async function loadTenants() {
    const declared = window.__SUPERO_CONFIG?.tenants;
    if (Array.isArray(declared) && declared.length) {
      return declared.map((t) => typeof t === "string" ? { name: t, label: t } : {
        name: String(t.name ?? ""),
        label: String(t.display_name ?? t.name ?? "")
      }).filter((t) => t.name && t.name !== "default-tenant");
    }
    try {
      const rows2 = await list("tenant");
      return rows2.map((t) => ({ name: String(t.name ?? ""), label: String(t.display_name ?? t.name ?? "") })).filter((t) => t.name && t.name !== "default-tenant");
    } catch {
      return [];
    }
  }
  function tenantOf(r2) {
    const fq = r2.fq_name;
    return Array.isArray(fq) && fq.length > 2 ? String(fq[2]) : "";
  }
  function scopeToTenant(fleet, tenant) {
    if (!tenant) return fleet;
    const keep = (xs) => xs.filter((x) => tenantOf(x) === tenant);
    return {
      clusters: keep(fleet.clusters),
      environments: keep(fleet.environments),
      leases: keep(fleet.leases),
      findings: keep(fleet.findings),
      policy: fleet.policies.find((p) => tenantOf(p) === tenant) ?? null,
      policies: fleet.policies
    };
  }
  function byUuid(items, uuid) {
    return items.find((i) => i.uuid === uuid) ?? null;
  }
  function envCluster(env, clusters) {
    if (!env) return null;
    const refs = env.Cluster_refs ?? env.cluster_refs;
    const ref = refs?.[0];
    const refUuid = ref?.uuid ?? ref?.to_uuid;
    if (refUuid) {
      const hit = byUuid(clusters, refUuid);
      if (hit) return hit;
    }
    return clusters.find((c) => c.name && (env.name ?? "").startsWith(c.name)) ?? null;
  }
  const update = (schema, uuid, data, item) => client.updateObject(schema, uuid, data, item);
  const createWithRefs = (schema, data, refs) => client.createObjectWithRefs(schema, data, refs);
  function parse(hash) {
    const clean = (hash || "#/").replace(/^#\/?/, "");
    const [head = "", arg = ""] = clean.split("/");
    return { head, arg, hash: hash || "#/" };
  }
  function current() {
    return parse(window.location.hash);
  }
  function navigate(hash) {
    if ((window.location.hash || "#/") !== hash) window.location.hash = hash;
  }
  function onChange(fn) {
    const handler = () => fn(current());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }
  function cfg() {
    return window.__SUPERO_CONFIG;
  }
  function canWrite(schema) {
    try {
      if (client.canWrite(schema)) return true;
      const ns = cfg()?.appNamespace;
      return ns ? Boolean(client.canWrite(`${ns}:${schema}`)) : false;
    } catch {
      return false;
    }
  }
  function isStaff() {
    try {
      if (client.isAdmin()) return true;
      if (canWrite("fleet_policy")) return true;
      const role = client.userInfo?.role ?? "";
      return ["tenant_admin", "domain_admin", "platform_admin", "developer"].includes(role);
    } catch {
      return false;
    }
  }
  function me() {
    const u = client.userInfo ?? {};
    return u.email ?? u.fullName ?? "";
  }
  function canSwitchTenant() {
    try {
      return Boolean(cfg()?.isMultiTenant && client.canSwitchTenant());
    } catch {
      return false;
    }
  }
  function toast(msg, kind = "info") {
    try {
      window.showToast?.(msg, kind);
    } catch {
    }
  }
  const C = {
    panel: "#111725",
    panel2: "#0E1420",
    line: "#1E2939",
    text: "#E6EDF7",
    mut: "#8A9BB4",
    dim: "#5C6B82",
    cyan: "#38BDF8",
    ok: "#34D399",
    warn: "#F59E0B",
    bad: "#F43F5E",
    violet: "#A78BFA"
  };
  function num(v, fallback = 0) {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isNaN(n) ? fallback : n;
  }
  function until(iso, now = Date.now()) {
    if (!iso) return "—";
    const ms = new Date(iso).getTime() - now;
    if (Number.isNaN(ms)) return "—";
    const mins = Math.abs(Math.round(ms / 6e4));
    const s = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`;
    return ms < 0 ? `${s} overdue` : `in ${s}`;
  }
  const ENV_TONE = {
    available: C.ok,
    claimed: C.cyan,
    expiring: C.warn,
    releasing: C.violet,
    disputed: C.bad,
    quarantined: C.warn
  };
  const ALLOC_TONE = { free: C.ok, allocated: C.cyan, unknown: C.bad };
  const CLUSTER_TONE = { healthy: C.ok, degraded: C.warn, unreachable: C.bad };
  const LEASE_TONE = {
    active: C.ok,
    expiring: C.warn,
    released: C.mut,
    release_failed: C.bad,
    force_reclaimed: C.violet
  };
  const FINDING_TONE = {
    open: C.bad,
    awaiting_second_approval: C.warn,
    resolved: C.ok,
    rejected: C.mut
  };
  const envTone = (v) => ENV_TONE[v] ?? C.mut;
  const allocTone = (v) => ALLOC_TONE[v] ?? C.mut;
  const clusterTone = (v) => CLUSTER_TONE[v] ?? C.mut;
  const leaseTone = (v) => LEASE_TONE[v] ?? C.mut;
  const findingTone = (v) => FINDING_TONE[v] ?? C.mut;
  var root$h = /* @__PURE__ */ from_html(`<button><!></button>`);
  function Btn($$anchor, $$props) {
    push($$props, true);
    let tone = prop($$props, "tone", 19, () => C.cyan), ghost = prop($$props, "ghost", 3, false), small = prop($$props, "small", 3, false), disabled = prop($$props, "disabled", 3, false), title = prop($$props, "title", 3, "");
    const style = /* @__PURE__ */ user_derived(() => disabled() ? `border:1px solid ${C.line};background:transparent;color:${C.dim};opacity:.55` : `border:1px solid ${ghost() ? tone() + "66" : tone()};background:${ghost() ? "transparent" : tone() + "1f"};color:${tone()}`);
    var button = root$h();
    let classes;
    var node = child(button);
    snippet(node, () => $$props.children ?? noop);
    template_effect(() => {
      set_attribute(button, "title", title());
      button.disabled = disabled();
      classes = set_class(
        button,
        1,
        `rounded-[7px] font-semibold transition-colors ${small() ? "px-[11px] py-[5px] text-xs" : "px-[15px] py-2 text-[13px]"}`,
        null,
        classes,
        {
          "cursor-not-allowed": disabled(),
          "cursor-pointer": !disabled()
        }
      );
      set_style(button, get(style));
    });
    delegated("click", button, function(...$$args) {
      $$props.onclick?.apply(this, $$args);
    });
    append($$anchor, button);
    pop();
  }
  delegate(["click"]);
  var root$g = /* @__PURE__ */ from_html(`<div class="flex-[1_1_260px] rounded-[10px] border border-rc-line bg-rc-panel p-5"><div class="mb-2 text-[14.5px] font-bold"> </div> <div class="text-[13.4px] leading-[1.6] text-rc-muted"> </div></div>`);
  var root_1$c = /* @__PURE__ */ from_html(`<div class="min-h-screen bg-rc-bg text-rc-text"><header class="flex flex-wrap items-center justify-between gap-3 border-b border-rc-line px-6 py-[18px]"><div class="flex items-center gap-2.5"><div class="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-sm font-extrabold" style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div> <span class="text-[17px] font-extrabold tracking-tight">Reclaim</span></div> <!></header> <section class="mx-auto max-w-[980px] px-6 pb-5 pt-16"><div class="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-rc-accent">Platform operations</div> <h1 class="m-0 mb-5 text-[clamp(30px,5.2vw,50px)] font-extrabold leading-[1.08] tracking-[-0.025em]">Every idle environment is a bill <span class="text-rc-accent">nobody agreed to pay</span>.</h1> <p class="m-0 mb-[30px] max-w-[680px] text-[17px] leading-[1.62] text-rc-muted">Reclaim tracks time-boxed leases on shared Kubernetes environments and reconciles the moment your
      records and your clusters stop agreeing &mdash; so a release that quietly failed becomes a decision
      someone makes, not a cost you discover next quarter.</p> <!></section> <section class="mx-auto max-w-[980px] px-6 pb-[70px] pt-[30px]"><div class="flex flex-wrap gap-[18px]"></div></section> <footer class="flex flex-wrap justify-between gap-2.5 border-t border-rc-line px-6 py-5 text-[12.5px] text-rc-dim"><span>Reclaim &mdash; environment lease reconciliation</span> <span>Demonstration fleet. All data is invented.</span></footer></div>`);
  function Landing($$anchor, $$props) {
    const points = [
      {
        title: "Two truths, kept apart",
        body: "What the record believes and what the cluster reports are stored separately, with the age of the last observation alongside. A disagreement is data, not an error to swallow."
      },
      {
        title: "No silent reclaims",
        body: "Destroying a workload on a stale reading is how a partitioned cluster becomes an outage. If the observation is too old to trust, Reclaim withdraws the option and tells you why."
      },
      {
        title: "Your rules, per organisation",
        body: "Staleness windows and whether a force reclaim needs a second approver are set per organisation, so a stricter fleet is a setting rather than a rebuild."
      }
    ];
    var div = root_1$c();
    var header = child(div);
    var node = sibling(child(header), 2);
    Btn(node, {
      get onclick() {
        return $$props.onSignIn;
      },
      children: ($$anchor2, $$slotProps) => {
        var text$1 = text("Sign in");
        append($$anchor2, text$1);
      },
      $$slots: { default: true }
    });
    var section = sibling(header, 2);
    var node_1 = sibling(child(section), 6);
    Btn(node_1, {
      get onclick() {
        return $$props.onSignIn;
      },
      children: ($$anchor2, $$slotProps) => {
        var text_1 = text("Sign in to your fleet");
        append($$anchor2, text_1);
      },
      $$slots: { default: true }
    });
    var section_1 = sibling(section, 2);
    var div_1 = child(section_1);
    each(div_1, 21, () => points, (p) => p.title, ($$anchor2, p) => {
      var div_2 = root$g();
      var div_3 = child(div_2);
      var text_2 = only_child(div_3, true);
      var div_4 = sibling(div_3, 2);
      var text_3 = only_child(div_4, true);
      template_effect(() => {
        set_text(text_2, get(p).title);
        set_text(text_3, get(p).body);
      });
      append($$anchor2, div_2);
    });
    append($$anchor, div);
  }
  var root$f = /* @__PURE__ */ from_html(`<div class="mb-3.5 rounded-[7px] px-[11px] py-2.5 text-[12.5px]" style="color:#F43F5E;background:#F43F5E12;border:1px solid #F43F5E44"> </div>`);
  var root_1$b = /* @__PURE__ */ from_html(`<div class="flex min-h-screen items-center justify-center bg-rc-bg p-5 text-rc-text"><div class="w-full max-w-[400px]"><div class="mb-[22px] flex items-center gap-2.5"><div class="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[15px] font-extrabold" style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div> <div><div class="text-lg font-extrabold">Reclaim</div> <div class="text-xs text-rc-muted">Sign in to your fleet</div></div></div> <form><div class="mb-4 rounded-[10px] border border-rc-line bg-rc-panel p-5"><!> <label class="text-xs font-semibold text-rc-muted" for="rc-email">Email</label> <input id="rc-email" type="email" autocomplete="username"/> <div class="h-3.5"></div> <label class="text-xs font-semibold text-rc-muted" for="rc-pw">Password</label> <input id="rc-pw" type="password" autocomplete="current-password"/> <button type="submit" class="mt-[18px] w-full rounded-[7px] px-3.5 py-2.5 text-sm font-bold" style="border:1px solid #38BDF8;background:#38BDF824;color:#38BDF8"> </button></div></form> <div class="text-center"><button class="text-[12.5px] text-rc-dim">&larr; Back</button></div></div></div>`);
  function Login($$anchor, $$props) {
    push($$props, true);
    let email = /* @__PURE__ */ state("");
    let password = /* @__PURE__ */ state("");
    let busy = /* @__PURE__ */ state(false);
    let error = /* @__PURE__ */ state("");
    async function submit(e) {
      e.preventDefault();
      if (!get(email) || !get(password)) {
        set(error, "Enter an email and password.");
        return;
      }
      set(busy, true);
      set(error, "");
      try {
        await login(get(email), get(password));
        $$props.onDone();
      } catch (ex) {
        set(error, ex instanceof Error ? ex.message : "Sign-in failed.", true);
      } finally {
        set(busy, false);
      }
    }
    const field = "mt-1.5 w-full rounded-[7px] border border-rc-line bg-rc-panel2 px-3 py-2.5 text-sm text-rc-text outline-none";
    var div = root_1$b();
    var div_1 = child(div);
    var form = sibling(child(div_1), 2);
    var div_2 = child(form);
    var node = child(div_2);
    {
      var consequent = ($$anchor2) => {
        var div_3 = root$f();
        var text2 = only_child(div_3, true);
        template_effect(() => set_text(text2, get(error)));
        append($$anchor2, div_3);
      };
      if_block(node, ($$render) => {
        if (get(error)) $$render(consequent);
      });
    }
    var input = sibling(node, 4);
    set_class(input, 1, clsx(field));
    var input_1 = sibling(input, 6);
    set_class(input_1, 1, clsx(field));
    var button = sibling(input_1, 2);
    var text_1 = only_child(button, true);
    var div_4 = sibling(form, 2);
    var button_1 = only_child(div_4);
    template_effect(() => {
      button.disabled = get(busy);
      set_text(text_1, get(busy) ? "Signing in…" : "Sign in");
    });
    event("submit", form, submit);
    bind_value(input, () => get(email), ($$value) => set(email, $$value));
    bind_value(input_1, () => get(password), ($$value) => set(password, $$value));
    delegated("click", button_1, function(...$$args) {
      $$props.onBack?.apply(this, $$args);
    });
    append($$anchor, div);
    pop();
  }
  delegate(["click"]);
  var root$e = /* @__PURE__ */ from_html(`<a class="whitespace-nowrap rounded-[7px] px-3 py-[7px] text-[13px] font-semibold no-underline"> </a>`);
  var root_1$a = /* @__PURE__ */ from_html(`<option> </option>`);
  var root_2$7 = /* @__PURE__ */ from_html(`<select class="rounded-[7px] border border-rc-line bg-rc-panel px-2.5 py-1.5 text-[12.5px] text-rc-text"><option>Viewing: all organisations</option><!></select>`);
  var root_3$7 = /* @__PURE__ */ from_html(`<div class="min-h-screen bg-rc-bg text-rc-text"><header class="flex flex-wrap items-center justify-between gap-3.5 border-b border-rc-line bg-rc-panel2 px-5 py-3"><div class="flex flex-wrap items-center gap-4"><div class="flex items-center gap-2.5"><div class="flex h-6 w-6 items-center justify-center rounded-md text-[13px] font-extrabold" style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div> <span class="text-[15.5px] font-extrabold">Reclaim</span></div> <nav class="flex flex-wrap gap-1.5"></nav></div> <div class="flex flex-wrap items-center gap-3"><!> <div class="text-right"><div class="text-[12.5px] font-semibold"> </div> <div class="text-[11px] text-rc-dim"> </div></div> <!></div></header> <main class="mx-auto max-w-[1180px] px-5 pb-[60px] pt-6"><!></main></div>`);
  function Shell($$anchor, $$props) {
    push($$props, true);
    const staff = /* @__PURE__ */ user_derived(isStaff);
    const tabs = /* @__PURE__ */ user_derived(() => [
      { hash: "#/", label: "Fleet" },
      { hash: "#/environments", label: "Environments" },
      { hash: "#/leases", label: "My leases" },
      ...get(staff) ? [
        { hash: "#/drift", label: "Drift queue" },
        { hash: "#/policy", label: "Policy" }
      ] : []
    ]);
    const here = /* @__PURE__ */ user_derived(() => $$props.route.split("/")[1] ?? "");
    let tenants = /* @__PURE__ */ state(proxy([]));
    user_effect(() => {
      if (!canSwitchTenant()) return;
      void loadTenants().then((t) => {
        set(tenants, t, true);
      });
    });
    const active = (hash) => hash === "#/" && get(here) === "" || hash !== "#/" && `#/${get(here)}` === hash;
    var div = root_3$7();
    var header = child(div);
    var div_1 = child(header);
    var nav = sibling(child(div_1), 2);
    each(nav, 21, () => get(tabs), (t) => t.hash, ($$anchor2, t) => {
      var a = root$e();
      var text2 = only_child(a, true);
      template_effect(
        ($0, $1, $2) => {
          set_attribute(a, "href", get(t).hash);
          set_style(a, `color:${$0 ?? ""};
                    background:${$1 ?? ""};
                    border:1px solid ${$2 ?? ""}`);
          set_text(text2, get(t).label);
        },
        [
          () => active(get(t).hash) ? C.cyan : C.mut,
          () => active(get(t).hash) ? C.cyan + "18" : "transparent",
          () => active(get(t).hash) ? C.cyan + "44" : "transparent"
        ]
      );
      append($$anchor2, a);
    });
    var div_2 = sibling(div_1, 2);
    var node = child(div_2);
    {
      var consequent = ($$anchor2) => {
        var select = root_2$7();
        var option = child(select);
        option.value = option.__value = "";
        var node_1 = sibling(option);
        each(node_1, 17, () => get(tenants), (t) => t.name, ($$anchor3, t) => {
          var option_1 = root_1$a();
          var text_1 = only_child(option_1);
          var option_1_value = {};
          template_effect(() => {
            set_text(text_1, `Viewing: ${get(t).label ?? ""}`);
            if (option_1_value !== (option_1_value = get(t).name)) {
              option_1.value = (option_1.__value = option_1_value) ?? "";
            }
          });
          append($$anchor3, option_1);
        });
        var select_value;
        init_select(select);
        template_effect(() => {
          if (select_value !== (select_value = $$props.tenant)) {
            select.value = (select.__value = select_value) ?? "", select_option(select, select_value);
          }
        });
        delegated("change", select, (e) => $$props.onTenant(e.currentTarget.value));
        append($$anchor2, select);
      };
      var d = /* @__PURE__ */ user_derived(() => canSwitchTenant() && get(tenants).length);
      if_block(node, ($$render) => {
        if (get(d)) $$render(consequent);
      });
    }
    var div_3 = sibling(node, 2);
    var div_4 = child(div_3);
    var text_2 = only_child(div_4, true);
    var div_5 = sibling(div_4, 2);
    var text_3 = only_child(div_5, true);
    var node_2 = sibling(div_3, 2);
    Btn(node_2, {
      small: true,
      ghost: true,
      get tone() {
        return C.mut;
      },
      get onclick() {
        return $$props.onLogout;
      },
      children: ($$anchor2, $$slotProps) => {
        var text_4 = text("Sign out");
        append($$anchor2, text_4);
      },
      $$slots: { default: true }
    });
    var main = sibling(header, 2);
    var node_3 = child(main);
    snippet(node_3, () => $$props.children ?? noop);
    template_effect(
      ($0) => {
        set_text(text_2, $0);
        set_text(text_3, get(staff) ? "platform admin" : "platform engineer");
      },
      [() => me()]
    );
    append($$anchor, div);
    pop();
  }
  delegate(["change"]);
  const DEFAULT_STALE_MINUTES = 30;
  function minutesSince(iso, now = Date.now()) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return null;
    return Math.max(0, Math.round((now - t) / 6e4));
  }
  function relative(iso, now = Date.now()) {
    const m = minutesSince(iso, now);
    if (m === null) return "never";
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const hours = Math.floor(m / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
  function staleness(cluster, policy2, now = Date.now()) {
    const limit = Number(policy2?.stale_observation_minutes) || DEFAULT_STALE_MINUTES;
    const age = cluster ? minutesSince(cluster.last_observed_at, now) : null;
    if (age === null) {
      return {
        stale: true,
        age: null,
        limit,
        why: "This cluster has never been successfully observed."
      };
    }
    if (age > limit) {
      const label = cluster?.display_name || cluster?.name || "this cluster";
      return {
        stale: true,
        age,
        limit,
        why: `The last successful observation of ${label} was ${relative(cluster?.last_observed_at, now)}, beyond this organisation’s ${limit}-minute window.`
      };
    }
    return { stale: false, age, limit, why: "" };
  }
  var root$d = /* @__PURE__ */ from_html(`<span class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap"><!></span>`);
  function Pill($$anchor, $$props) {
    var span = root$d();
    var node = child(span);
    snippet(node, () => $$props.children ?? noop);
    template_effect(() => set_style(span, `color:${$$props.tone ?? ""};border:1px solid ${$$props.tone ?? ""}55;background:${$$props.tone ?? ""}14;font-family:var(--font-rc-mono)`));
    append($$anchor, span);
  }
  var root$c = /* @__PURE__ */ from_html(`<div><!></div>`);
  function Panel($$anchor, $$props) {
    let pad = prop($$props, "pad", 3, "p-[18px]");
    var div = root$c();
    var node = child(div);
    snippet(node, () => $$props.children ?? noop);
    template_effect(() => set_class(div, 1, `mb-4 rounded-[10px] border border-rc-line bg-rc-panel ${pad() ?? ""}`));
    append($$anchor, div);
  }
  var root$b = /* @__PURE__ */ from_html(`<div class="mt-1 text-[11.5px] text-rc-dim"> </div>`);
  var root_1$9 = /* @__PURE__ */ from_html(`<div class="min-w-[140px] flex-[1_1_150px] rounded-[10px] border border-rc-line bg-rc-panel px-4 py-[14px]"><div class="text-[11px] font-semibold uppercase tracking-[0.07em] text-rc-muted"> </div> <div class="mt-1.5 text-[26px] font-bold"> </div> <!></div>`);
  function Metric($$anchor, $$props) {
    push($$props, true);
    let tone = prop($$props, "tone", 19, () => C.text), sub = prop($$props, "sub", 3, "");
    var div = root_1$9();
    var div_1 = child(div);
    var text2 = only_child(div_1, true);
    var div_2 = sibling(div_1, 2);
    var text_1 = only_child(div_2, true);
    var node = sibling(div_2, 2);
    {
      var consequent = ($$anchor2) => {
        var div_3 = root$b();
        var text_2 = only_child(div_3, true);
        template_effect(() => set_text(text_2, sub()));
        append($$anchor2, div_3);
      };
      if_block(node, ($$render) => {
        if (sub()) $$render(consequent);
      });
    }
    template_effect(() => {
      set_text(text2, $$props.label);
      set_style(div_2, `color:${tone() ?? ""};font-family:var(--font-rc-mono)`);
      set_text(text_1, $$props.value);
    });
    append($$anchor, div);
    pop();
  }
  var root$a = /* @__PURE__ */ from_html(`<div class="mb-3.5 rounded-[9px] px-3.5 py-3 text-[13px] leading-relaxed"><div class="mb-1 text-[12.5px] font-bold uppercase tracking-[0.06em]"> </div> <div class="text-rc-muted"><!></div></div>`);
  function Banner($$anchor, $$props) {
    push($$props, true);
    let tone = prop($$props, "tone", 19, () => C.warn);
    var div = root$a();
    var div_1 = child(div);
    var text2 = only_child(div_1, true);
    var div_2 = sibling(div_1, 2);
    var node = child(div_2);
    snippet(node, () => $$props.children ?? noop);
    template_effect(() => {
      set_style(div, `border:1px solid ${tone() ?? ""}55;background:${tone() ?? ""}12`);
      set_style(div_1, `color:${tone() ?? ""}`);
      set_text(text2, $$props.title);
    });
    append($$anchor, div);
    pop();
  }
  var root$9 = /* @__PURE__ */ from_html(`<div class="px-[18px] py-9 text-center text-[13.5px] text-rc-dim"><!></div>`);
  function Empty($$anchor, $$props) {
    var div = root$9();
    var node = child(div);
    snippet(node, () => $$props.children ?? noop);
    append($$anchor, div);
  }
  var root$8 = /* @__PURE__ */ from_html(`<div class="mt-[3px] text-[12.5px] text-rc-muted"> </div>`);
  var root_1$8 = /* @__PURE__ */ from_html(`<div class="mb-3"><div class="text-[15px] font-bold text-rc-text"> </div> <!></div>`);
  function SectionTitle($$anchor, $$props) {
    let sub = prop($$props, "sub", 3, "");
    var div = root_1$8();
    var div_1 = child(div);
    var text2 = only_child(div_1, true);
    var node = sibling(div_1, 2);
    {
      var consequent = ($$anchor2) => {
        var div_2 = root$8();
        var text_1 = only_child(div_2, true);
        template_effect(() => set_text(text_1, sub()));
        append($$anchor2, div_2);
      };
      if_block(node, ($$render) => {
        if (sub()) $$render(consequent);
      });
    }
    template_effect(() => set_text(text2, $$props.title));
    append($$anchor, div);
  }
  var root$7 = /* @__PURE__ */ from_svg(`<text x="0" font-size="11.5" font-family="var(--font-rc-mono)"> </text><rect height="13" rx="3"></rect><rect height="13" rx="3" opacity="0.85"></rect><text font-size="11.5" font-family="var(--font-rc-mono)"> </text>`, 1);
  var root_1$7 = /* @__PURE__ */ from_svg(`<svg width="100%" role="img" aria-label="Allocated environments against capacity, by cluster"></svg>`);
  function CapacityChart($$anchor, $$props) {
    push($$props, true);
    const W = 560;
    const ROW_H = 26;
    const PAD = 104;
    const barW = W - PAD - 56;
    const maxCap = /* @__PURE__ */ user_derived(() => Math.max(1, ...$$props.rows.map((r2) => r2.cap)));
    const height = /* @__PURE__ */ user_derived(() => $$props.rows.length * ROW_H + 14);
    function tone(r2) {
      if (r2.stale) return C.bad;
      return r2.used / Math.max(1, r2.cap) > 0.85 ? C.warn : C.cyan;
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        var svg = root_1$7();
        set_style(svg, "max-width:560px;display:block");
        each(svg, 23, () => $$props.rows, (r2) => r2.label, ($$anchor3, r2, i) => {
          const y = /* @__PURE__ */ user_derived(() => get(i) * ROW_H + 8);
          const w = /* @__PURE__ */ user_derived(() => Math.max(2, Math.round(get(r2).used / get(maxCap) * barW)));
          var fragment_1 = root$7();
          var text2 = first_child(fragment_1);
          var text_1 = only_child(text2, true);
          var rect = sibling(text2);
          set_attribute(rect, "x", PAD);
          set_attribute(rect, "width", barW);
          var rect_1 = sibling(rect);
          set_attribute(rect_1, "x", PAD);
          var text_2 = sibling(rect_1);
          set_attribute(text_2, "x", PAD + barW + 8);
          var text_3 = only_child(text_2);
          template_effect(
            ($0) => {
              set_attribute(text2, "y", get(y) + 12);
              set_attribute(text2, "fill", C.mut);
              set_text(text_1, get(r2).label);
              set_attribute(rect, "y", get(y) + 2);
              set_attribute(rect, "fill", C.panel2);
              set_attribute(rect, "stroke", C.line);
              set_attribute(rect_1, "y", get(y) + 2);
              set_attribute(rect_1, "width", get(w));
              set_attribute(rect_1, "fill", $0);
              set_attribute(text_2, "y", get(y) + 12);
              set_attribute(text_2, "fill", C.mut);
              set_text(text_3, `${get(r2).used ?? ""}/${get(r2).cap ?? ""}`);
            },
            [() => tone(get(r2))]
          );
          append($$anchor3, fragment_1);
        });
        template_effect(() => {
          set_attribute(svg, "viewBox", `0 0 560 ${get(height) ?? ""}`);
          set_attribute(svg, "height", get(height));
        });
        append($$anchor2, svg);
      };
      if_block(node, ($$render) => {
        if ($$props.rows.length) $$render(consequent);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  var root$6 = /* @__PURE__ */ from_html(`<a href="#/drift" class="text-rc-accent">Open the drift queue &rarr;</a>`);
  var root_1$6 = /* @__PURE__ */ from_html(`An environment is in dispute when what Reclaim believes and what its cluster reports no longer agree. <!>`, 1);
  var root_2$6 = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  var root_3$6 = /* @__PURE__ */ from_html(`<div class="mt-1.5 text-[11.5px] leading-relaxed"> </div>`);
  var root_4$4 = /* @__PURE__ */ from_html(`<div class="min-w-[280px] flex-[1_1_300px] rounded-[10px] bg-rc-panel p-4"><div class="mb-2.5 flex items-start justify-between gap-2.5"><div><div class="text-[14.5px] font-bold" style="font-family:var(--font-rc-mono)"> </div> <div class="mt-0.5 text-xs text-rc-muted"> </div></div> <!></div> <div class="mt-3"><div class="mb-1.5 flex justify-between text-[11.5px] text-rc-muted"><span>Allocated</span> <span style="font-family:var(--font-rc-mono)"> </span></div> <div class="h-1.5 overflow-hidden rounded border border-rc-line bg-rc-panel2"><div class="h-full"></div></div></div> <div class="mt-3 border-t border-rc-line pt-2.5 text-xs"><span class="text-rc-muted">Last observed</span> <span class="font-semibold"> </span> <!></div></div>`);
  var root_5$4 = /* @__PURE__ */ from_html(`<!> <div class="mb-[18px] flex flex-wrap gap-3.5"><!> <!> <!> <!></div> <!> <!> <div class="flex flex-wrap gap-3.5"></div>`, 1);
  function Fleet($$anchor, $$props) {
    push($$props, true);
    const open = /* @__PURE__ */ user_derived(() => $$props.fleet.findings.filter((f) => f.finding_state === "open" || f.finding_state === "awaiting_second_approval"));
    const disputed = /* @__PURE__ */ user_derived(() => $$props.fleet.environments.filter((e) => e.env_state === "disputed"));
    const idleCost = /* @__PURE__ */ user_derived(() => get(disputed).reduce((a, e) => a + num(e.monthly_cost_usd), 0));
    const usedOn = (c) => $$props.fleet.environments.filter((e) => envCluster(e, $$props.fleet.clusters) === c && e.observed_allocation === "allocated").length;
    const chartRows = /* @__PURE__ */ user_derived(() => $$props.fleet.clusters.map((c) => ({
      label: c.display_name || c.name || "?",
      used: usedOn(c),
      cap: num(c.capacity),
      stale: staleness(c, $$props.fleet.policy).stale
    })));
    var fragment = root_5$4();
    var node = first_child(fragment);
    SectionTitle(node, {
      title: "Fleet",
      sub: "Capacity, observation freshness and anything currently in dispute."
    });
    var div = sibling(node, 2);
    var node_1 = child(div);
    {
      let $0 = /* @__PURE__ */ user_derived(() => $$props.fleet.environments.filter((e) => e.env_state === "available").length);
      Metric(node_1, {
        label: "Environments",
        get value() {
          return $$props.fleet.environments.length;
        },
        get sub() {
          return `${get($0) ?? ""} available`;
        }
      });
    }
    var node_2 = sibling(node_1, 2);
    {
      let $0 = /* @__PURE__ */ user_derived(() => get(disputed).length ? C.bad : C.ok);
      Metric(node_2, {
        label: "In dispute",
        get value() {
          return get(disputed).length;
        },
        get tone() {
          return get($0);
        },
        sub: "record and cluster disagree"
      });
    }
    var node_3 = sibling(node_2, 2);
    {
      let $0 = /* @__PURE__ */ user_derived(() => get(open).length ? C.warn : C.ok);
      Metric(node_3, {
        label: "Open findings",
        get value() {
          return get(open).length;
        },
        get tone() {
          return get($0);
        },
        sub: "awaiting a decision"
      });
    }
    var node_4 = sibling(node_3, 2);
    {
      let $0 = /* @__PURE__ */ user_derived(() => "$" + Math.round(get(idleCost)));
      let $1 = /* @__PURE__ */ user_derived(() => get(idleCost) ? C.warn : C.ok);
      Metric(node_4, {
        label: "Disputed spend",
        get value() {
          return get($0);
        },
        get tone() {
          return get($1);
        },
        sub: "per month, unverified"
      });
    }
    var node_5 = sibling(div, 2);
    {
      var consequent_1 = ($$anchor2) => {
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(open).length);
          let $1 = /* @__PURE__ */ user_derived(() => get(open).length > 1 ? "s" : "");
          Banner($$anchor2, {
            get tone() {
              return C.bad;
            },
            get title() {
              return `${get($0) ?? ""} finding${get($1) ?? ""} need a decision`;
            },
            children: ($$anchor3, $$slotProps) => {
              var fragment_2 = root_1$6();
              var node_6 = sibling(first_child(fragment_2));
              {
                var consequent = ($$anchor4) => {
                  var a_1 = root$6();
                  append($$anchor4, a_1);
                };
                var d = /* @__PURE__ */ user_derived(() => isStaff());
                var alternate = ($$anchor4) => {
                  var text$1 = text("A platform admin resolves these.");
                  append($$anchor4, text$1);
                };
                if_block(node_6, ($$render) => {
                  if (get(d)) $$render(consequent);
                  else $$render(alternate, -1);
                });
              }
              append($$anchor3, fragment_2);
            },
            $$slots: { default: true }
          });
        }
      };
      if_block(node_5, ($$render) => {
        if (get(open).length) $$render(consequent_1);
      });
    }
    var node_7 = sibling(node_5, 2);
    {
      var consequent_2 = ($$anchor2) => {
        Panel($$anchor2, {
          children: ($$anchor3, $$slotProps) => {
            var fragment_4 = root_2$6();
            var node_8 = first_child(fragment_4);
            SectionTitle(node_8, {
              title: "Allocation against capacity",
              sub: "Bars turn red where the observation behind them is too old to trust."
            });
            var node_9 = sibling(node_8, 2);
            CapacityChart(node_9, {
              get rows() {
                return get(chartRows);
              }
            });
            append($$anchor3, fragment_4);
          },
          $$slots: { default: true }
        });
      };
      if_block(node_7, ($$render) => {
        if ($$props.fleet.clusters.length) $$render(consequent_2);
      });
    }
    var div_1 = sibling(node_7, 2);
    each(
      div_1,
      21,
      () => $$props.fleet.clusters,
      (c) => c.uuid,
      ($$anchor2, c) => {
        const s = /* @__PURE__ */ user_derived(() => staleness(get(c), $$props.fleet.policy));
        const cap = /* @__PURE__ */ user_derived(() => num(get(c).capacity));
        const used = /* @__PURE__ */ user_derived(() => usedOn(get(c)));
        const pct = /* @__PURE__ */ user_derived(() => get(cap) ? Math.min(100, Math.round(get(used) / get(cap) * 100)) : 0);
        var div_2 = root_4$4();
        var div_3 = child(div_2);
        var div_4 = child(div_3);
        var div_5 = child(div_4);
        var text_1 = only_child(div_5, true);
        var div_6 = sibling(div_5, 2);
        var text_2 = only_child(div_6);
        var node_10 = sibling(div_4, 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => clusterTone(get(c).cluster_state));
          Pill(node_10, {
            get tone() {
              return get($0);
            },
            children: ($$anchor3, $$slotProps) => {
              var text_3 = text();
              template_effect(() => set_text(text_3, get(c).cluster_state));
              append($$anchor3, text_3);
            }
          });
        }
        var div_7 = sibling(div_3, 2);
        var div_8 = child(div_7);
        var span = sibling(child(div_8), 2);
        var text_4 = only_child(span);
        var div_9 = sibling(div_8, 2);
        var div_10 = only_child(div_9);
        var div_11 = sibling(div_7, 2);
        var span_1 = sibling(child(div_11), 2);
        var text_5 = only_child(span_1, true);
        var node_11 = sibling(span_1, 2);
        {
          var consequent_3 = ($$anchor3) => {
            var div_12 = root_3$6();
            var text_6 = only_child(div_12);
            template_effect(() => {
              set_style(div_12, `color:${C.bad}`);
              set_text(text_6, `Beyond the ${get(s).limit ?? ""}-minute window — destructive actions are withheld on this cluster.`);
            });
            append($$anchor3, div_12);
          };
          if_block(node_11, ($$render) => {
            if (get(s).stale) $$render(consequent_3);
          });
        }
        template_effect(
          ($0, $1) => {
            set_style(div_2, `border:1px solid ${(get(s).stale ? C.bad + "55" : C.line) ?? ""}`);
            set_text(text_1, get(c).display_name || get(c).name);
            set_text(text_2, `${$0 ?? ""} · ${get(c).region ?? "" ?? ""}`);
            set_text(text_4, `${get(used) ?? ""} / ${get(cap) ?? ""}`);
            set_style(div_10, `width:${get(pct) ?? ""}%;background:${(get(pct) > 85 ? C.warn : C.cyan) ?? ""}`);
            set_style(span_1, `color:${(get(s).stale ? C.bad : C.ok) ?? ""}`);
            set_text(text_5, $1);
          },
          [
            () => (get(c).provider ?? "").toUpperCase(),
            () => relative(get(c).last_observed_at)
          ]
        );
        append($$anchor2, div_2);
      },
      ($$anchor2) => {
        Empty($$anchor2, {
          children: ($$anchor3, $$slotProps) => {
            var text_7 = text("No clusters in this organisation.");
            append($$anchor3, text_7);
          }
        });
      }
    );
    append($$anchor, fragment);
    pop();
  }
  var root$5 = /* @__PURE__ */ from_html(`<option> </option>`);
  var root_1$5 = /* @__PURE__ */ from_html(`<tr class="cursor-pointer"><td><div class="text-[12.5px] font-semibold" style="font-family:var(--font-rc-mono)"> </div> <div class="mt-0.5 text-[11.5px] text-rc-dim"> </div></td><td><!></td><td><!></td><td> </td><td style="font-family:var(--font-rc-mono)"> </td></tr>`);
  var root_2$5 = /* @__PURE__ */ from_html(`<table class="w-full border-collapse"><thead><tr><th>Environment</th><th>Reclaim believes</th><th>Cluster reports</th><th>Holder</th><th>Cost</th></tr></thead><tbody></tbody></table>`);
  var root_3$5 = /* @__PURE__ */ from_html(`<!> <div class="mb-3.5"><select class="rounded-[7px] border border-rc-line bg-rc-panel2 px-2.5 py-[7px] text-[13px] text-rc-text"><option>all</option><!></select></div> <!>`, 1);
  function Environments($$anchor, $$props) {
    push($$props, true);
    let filter = /* @__PURE__ */ state("all");
    const shown = /* @__PURE__ */ user_derived(() => get(filter) === "all" ? $$props.fleet.environments : $$props.fleet.environments.filter((e) => e.env_state === get(filter)));
    const TH = "px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line";
    const TD = "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line";
    var fragment = root_3$5();
    var node = first_child(fragment);
    SectionTitle(node, {
      title: "Environments",
      sub: "Believed state on the left, the cluster’s last report beside it. They should match."
    });
    var div = sibling(node, 2);
    var select = child(div);
    var option = child(select);
    option.value = option.__value = "all";
    var node_1 = sibling(option);
    each(node_1, 16, () => ENV_STATES, (s) => s, ($$anchor2, s) => {
      var option_1 = root$5();
      var text2 = only_child(option_1, true);
      var option_1_value = {};
      template_effect(() => {
        set_text(text2, s);
        if (option_1_value !== (option_1_value = s)) {
          option_1.value = (option_1.__value = option_1_value) ?? "";
        }
      });
      append($$anchor2, option_1);
    });
    init_select(select);
    var node_2 = sibling(div, 2);
    Panel(node_2, {
      pad: "p-0",
      children: ($$anchor2, $$slotProps) => {
        var fragment_1 = comment();
        var node_3 = first_child(fragment_1);
        {
          var consequent = ($$anchor3) => {
            var table = root_2$5();
            var thead = child(table);
            var tr = child(thead);
            var th = child(tr);
            set_class(th, 1, clsx(TH));
            var th_1 = sibling(th);
            set_class(th_1, 1, clsx(TH));
            var th_2 = sibling(th_1);
            set_class(th_2, 1, clsx(TH));
            var th_3 = sibling(th_2);
            set_class(th_3, 1, clsx(TH));
            var th_4 = sibling(th_3);
            set_class(th_4, 1, "px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line rc-hide-sm");
            var tbody = sibling(thead);
            each(tbody, 21, () => get(shown), (e) => e.uuid, ($$anchor4, e) => {
              const mismatch = /* @__PURE__ */ user_derived(() => get(e).env_state === "disputed" || get(e).observed_allocation === "unknown");
              var tr_1 = root_1$5();
              var td = child(tr_1);
              set_class(td, 1, clsx(TD));
              var div_1 = child(td);
              var text_1 = only_child(div_1, true);
              var div_2 = sibling(div_1, 2);
              var text_2 = only_child(div_2, true);
              var td_1 = sibling(td);
              set_class(td_1, 1, clsx(TD));
              var node_4 = child(td_1);
              {
                let $0 = /* @__PURE__ */ user_derived(() => envTone(get(e).env_state));
                Pill(node_4, {
                  get tone() {
                    return get($0);
                  },
                  children: ($$anchor5, $$slotProps2) => {
                    var text_3 = text();
                    template_effect(() => set_text(text_3, get(e).env_state));
                    append($$anchor5, text_3);
                  }
                });
              }
              var td_2 = sibling(td_1);
              set_class(td_2, 1, clsx(TD));
              var node_5 = child(td_2);
              {
                let $0 = /* @__PURE__ */ user_derived(() => allocTone(get(e).observed_allocation));
                Pill(node_5, {
                  get tone() {
                    return get($0);
                  },
                  children: ($$anchor5, $$slotProps2) => {
                    var text_4 = text();
                    template_effect(() => set_text(text_4, `cluster: ${get(e).observed_allocation ?? ""}`));
                    append($$anchor5, text_4);
                  }
                });
              }
              var td_3 = sibling(td_2);
              set_class(td_3, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
              var text_5 = only_child(td_3, true);
              var td_4 = sibling(td_3);
              set_class(td_4, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line rc-hide-sm text-[12.5px] text-rc-muted");
              var text_6 = only_child(td_4, true);
              template_effect(
                ($0) => {
                  set_style(tr_1, get(mismatch) ? `background:${C.bad}0b` : "");
                  set_text(text_1, get(e).display_name || get(e).name);
                  set_text(text_2, get(e).namespace_path);
                  set_text(text_5, get(e).current_holder || "—");
                  set_text(text_6, $0);
                },
                [
                  () => get(e).monthly_cost_usd ? "$" + Math.round(num(get(e).monthly_cost_usd)) + "/mo" : "—"
                ]
              );
              delegated("click", tr_1, () => navigate("#/env/" + get(e).uuid));
              append($$anchor4, tr_1);
            });
            append($$anchor3, table);
          };
          var alternate = ($$anchor3) => {
            Empty($$anchor3, {
              children: ($$anchor4, $$slotProps2) => {
                var text_7 = text("No environments match that filter.");
                append($$anchor4, text_7);
              }
            });
          };
          if_block(node_3, ($$render) => {
            if (get(shown).length) $$render(consequent);
            else $$render(alternate, -1);
          });
        }
        append($$anchor2, fragment_1);
      },
      $$slots: { default: true }
    });
    bind_select_value(select, () => get(filter), ($$value) => set(filter, $$value));
    append($$anchor, fragment);
    pop();
  }
  delegate(["click"]);
  var root$4 = /* @__PURE__ */ from_html(`<tr><td> </td><td> </td><td> </td><td><!></td></tr>`);
  var root_1$4 = /* @__PURE__ */ from_html(`<table class="w-full border-collapse"><thead><tr><th>Holder</th><th>Team</th><th>Expires</th><th>State</th></tr></thead><tbody></tbody></table>`);
  var root_2$4 = /* @__PURE__ */ from_html(`<div class="mt-3 whitespace-pre-wrap break-words rounded-[7px] border border-rc-line bg-rc-panel2 px-3 py-2.5 text-[11.5px]"> </div>`);
  var root_3$4 = /* @__PURE__ */ from_html(`<!> <!> <!>`, 1);
  var root_4$3 = /* @__PURE__ */ from_html(`<a class="text-[12.5px] text-rc-accent">Review &rarr;</a>`);
  var root_5$3 = /* @__PURE__ */ from_html(`<div class="flex items-center justify-between gap-2.5 border-b border-rc-line py-2.5"><div><div class="text-[13px]"> </div> <div class="mt-0.5 text-[11.5px] text-rc-dim"> </div></div> <div class="flex items-center gap-2"><!> <!></div></div>`);
  var root_6$1 = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  var root_7$1 = /* @__PURE__ */ from_html(`<a href="#/environments" class="mb-3 inline-block text-[12.5px] text-rc-dim">&larr; Environments</a> <!> <div class="mb-4 flex flex-wrap gap-3.5"><div class="flex-[1_1_220px] rounded-[10px] border border-rc-line bg-rc-panel p-4"><div class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Reclaim believes</div> <!></div> <div class="flex-[1_1_220px] rounded-[10px] border border-rc-line bg-rc-panel p-4"><div class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Cluster last reported</div> <!> <div class="mt-2 text-[11.5px]"> </div></div></div> <!> <!> <!>`, 1);
  function EnvDetail($$anchor, $$props) {
    push($$props, true);
    const env = /* @__PURE__ */ user_derived(() => byUuid($$props.fleet.environments, $$props.uuid));
    const cluster = /* @__PURE__ */ user_derived(() => envCluster(get(env), $$props.fleet.clusters));
    const stale = /* @__PURE__ */ user_derived(() => staleness(get(cluster), $$props.fleet.policy));
    const leases = /* @__PURE__ */ user_derived(() => $$props.fleet.leases.filter((l) => l.environment_uuid === $$props.uuid));
    const findings = /* @__PURE__ */ user_derived(() => $$props.fleet.findings.filter((f) => f.environment_uuid === $$props.uuid));
    const agree = /* @__PURE__ */ user_derived(() => !!get(env) && get(env).observed_allocation !== "unknown" && (get(env).env_state === "available" && get(env).observed_allocation === "free" || get(env).env_state !== "available" && get(env).env_state !== "disputed" && get(env).observed_allocation === "allocated"));
    const TH = "px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line";
    const TD = "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line";
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        Empty($$anchor2, {
          children: ($$anchor3, $$slotProps) => {
            var text$1 = text("That environment is not in this organisation.");
            append($$anchor3, text$1);
          }
        });
      };
      var alternate_1 = ($$anchor2) => {
        var fragment_2 = root_7$1();
        var node_1 = sibling(first_child(fragment_2), 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(env).display_name || get(env).name || "");
          let $1 = /* @__PURE__ */ user_derived(() => get(env).namespace_path ?? "");
          SectionTitle(node_1, {
            get title() {
              return get($0);
            },
            get sub() {
              return get($1);
            }
          });
        }
        var div = sibling(node_1, 2);
        var div_1 = child(div);
        var node_2 = sibling(child(div_1), 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => envTone(get(env).env_state));
          Pill(node_2, {
            get tone() {
              return get($0);
            },
            children: ($$anchor3, $$slotProps) => {
              var text_1 = text();
              template_effect(() => set_text(text_1, get(env).env_state));
              append($$anchor3, text_1);
            }
          });
        }
        var div_2 = sibling(div_1, 2);
        var node_3 = sibling(child(div_2), 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => allocTone(get(env).observed_allocation));
          Pill(node_3, {
            get tone() {
              return get($0);
            },
            children: ($$anchor3, $$slotProps) => {
              var text_2 = text();
              template_effect(() => set_text(text_2, get(env).observed_allocation));
              append($$anchor3, text_2);
            }
          });
        }
        var div_3 = sibling(node_3, 2);
        var text_3 = only_child(div_3, true);
        var node_4 = sibling(div, 2);
        {
          var consequent_1 = ($$anchor3) => {
            Banner($$anchor3, {
              get tone() {
                return C.bad;
              },
              title: "These do not agree",
              children: ($$anchor4, $$slotProps) => {
                var text_4 = text();
                template_effect(() => set_text(text_4, `Reclaim believes this environment is ${get(env).env_state ?? ""}, while its cluster last reported it
      ${get(env).observed_allocation ?? ""}. Until that is resolved the slot is neither safely reusable nor
      safely destroyable.`));
                append($$anchor4, text_4);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_4, ($$render) => {
            if (!get(agree)) $$render(consequent_1);
          });
        }
        var node_5 = sibling(node_4, 2);
        Panel(node_5, {
          children: ($$anchor3, $$slotProps) => {
            var fragment_7 = root_3$4();
            var node_6 = first_child(fragment_7);
            SectionTitle(node_6, { title: "Lease history" });
            var node_7 = sibling(node_6, 2);
            {
              var consequent_2 = ($$anchor4) => {
                var table = root_1$4();
                var thead = child(table);
                var tr = child(thead);
                var th = child(tr);
                set_class(th, 1, clsx(TH));
                var th_1 = sibling(th);
                set_class(th_1, 1, clsx(TH));
                var th_2 = sibling(th_1);
                set_class(th_2, 1, clsx(TH));
                var th_3 = sibling(th_2);
                set_class(th_3, 1, clsx(TH));
                var tbody = sibling(thead);
                each(tbody, 21, () => get(leases), (l) => l.uuid, ($$anchor5, l) => {
                  var tr_1 = root$4();
                  var td = child(tr_1);
                  set_class(td, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px]");
                  var text_5 = only_child(td, true);
                  var td_1 = sibling(td);
                  set_class(td_1, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
                  var text_6 = only_child(td_1, true);
                  var td_2 = sibling(td_1);
                  set_class(td_2, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
                  var text_7 = only_child(td_2, true);
                  var td_3 = sibling(td_2);
                  set_class(td_3, 1, clsx(TD));
                  var node_8 = child(td_3);
                  {
                    let $0 = /* @__PURE__ */ user_derived(() => leaseTone(get(l).lease_state));
                    Pill(node_8, {
                      get tone() {
                        return get($0);
                      },
                      children: ($$anchor6, $$slotProps2) => {
                        var text_8 = text();
                        template_effect(() => set_text(text_8, get(l).lease_state));
                        append($$anchor6, text_8);
                      }
                    });
                  }
                  template_effect(
                    ($0) => {
                      set_text(text_5, get(l).requested_by);
                      set_text(text_6, get(l).team);
                      set_text(text_7, $0);
                    },
                    [() => until(get(l).expires_at)]
                  );
                  append($$anchor5, tr_1);
                });
                append($$anchor4, table);
              };
              var alternate = ($$anchor4) => {
                Empty($$anchor4, {
                  children: ($$anchor5, $$slotProps2) => {
                    var text_9 = text("Never leased.");
                    append($$anchor5, text_9);
                  }
                });
              };
              if_block(node_7, ($$render) => {
                if (get(leases).length) $$render(consequent_2);
                else $$render(alternate, -1);
              });
            }
            var node_9 = sibling(node_7, 2);
            each(node_9, 17, () => get(leases).filter((l) => l.last_release_error), (l) => l.uuid, ($$anchor4, l) => {
              var div_4 = root_2$4();
              var text_10 = only_child(div_4, true);
              template_effect(() => {
                set_style(div_4, `font-family:var(--font-rc-mono);color:${C.bad}`);
                set_text(text_10, get(l).last_release_error);
              });
              append($$anchor4, div_4);
            });
            append($$anchor3, fragment_7);
          },
          $$slots: { default: true }
        });
        var node_10 = sibling(node_5, 2);
        {
          var consequent_4 = ($$anchor3) => {
            Panel($$anchor3, {
              children: ($$anchor4, $$slotProps) => {
                var fragment_11 = root_6$1();
                var node_11 = first_child(fragment_11);
                SectionTitle(node_11, { title: "Findings" });
                var node_12 = sibling(node_11, 2);
                each(node_12, 17, () => get(findings), (f) => f.uuid, ($$anchor5, f) => {
                  var div_5 = root_5$3();
                  var div_6 = child(div_5);
                  var div_7 = child(div_6);
                  var text_11 = only_child(div_7, true);
                  var div_8 = sibling(div_7, 2);
                  var text_12 = only_child(div_8);
                  var div_9 = sibling(div_6, 2);
                  var node_13 = child(div_9);
                  {
                    let $0 = /* @__PURE__ */ user_derived(() => findingTone(get(f).finding_state));
                    Pill(node_13, {
                      get tone() {
                        return get($0);
                      },
                      children: ($$anchor6, $$slotProps2) => {
                        var text_13 = text();
                        template_effect(() => set_text(text_13, get(f).finding_state));
                        append($$anchor6, text_13);
                      }
                    });
                  }
                  var node_14 = sibling(node_13, 2);
                  {
                    var consequent_3 = ($$anchor6) => {
                      var a = root_4$3();
                      template_effect(() => set_attribute(a, "href", `#/drift/${get(f).uuid ?? ""}`));
                      append($$anchor6, a);
                    };
                    var d = /* @__PURE__ */ user_derived(() => isStaff());
                    if_block(node_14, ($$render) => {
                      if (get(d)) $$render(consequent_3);
                    });
                  }
                  template_effect(
                    ($0) => {
                      set_text(text_11, get(f).display_name);
                      set_text(text_12, `detected ${$0 ?? ""}`);
                    },
                    [() => relative(get(f).detected_at)]
                  );
                  append($$anchor5, div_5);
                });
                append($$anchor4, fragment_11);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_10, ($$render) => {
            if (get(findings).length) $$render(consequent_4);
          });
        }
        template_effect(
          ($0) => {
            set_style(div_3, `color:${(get(stale).stale ? C.bad : C.dim) ?? ""}`);
            set_text(text_3, $0);
          },
          [
            () => get(cluster) ? relative(get(cluster).last_observed_at) : "no cluster linked"
          ]
        );
        append($$anchor2, fragment_2);
      };
      if_block(node, ($$render) => {
        if (!get(env)) $$render(consequent);
        else $$render(alternate_1, -1);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  async function act(workflowId, input, fallback) {
    try {
      const run = window.services?.workflow?.run;
      if (!run) throw new Error("workflows unavailable");
      const result = await run.call(window.services.workflow, workflowId, input);
      if (result?.status === "failed") throw new Error("workflow reported failed");
      return "workflow";
    } catch {
      await fallback();
      return "direct";
    }
  }
  var root$3 = /* @__PURE__ */ from_html(`<option> </option>`);
  var root_1$3 = /* @__PURE__ */ from_html(`<!> <div class="flex flex-wrap gap-3"><div class="flex-[2_1_220px]"><label class="text-[11.5px] font-semibold text-rc-muted" for="rc-env">Environment</label> <select id="rc-env"></select></div> <div class="flex-[1_1_130px]"><label class="text-[11.5px] font-semibold text-rc-muted" for="rc-team">Team</label> <input id="rc-team" placeholder="atlas"/></div> <div class="flex-[2_1_200px]"><label class="text-[11.5px] font-semibold text-rc-muted" for="rc-purpose">Purpose</label> <input id="rc-purpose" placeholder="What is it for?"/></div> <div class="flex-[0_1_110px]"><label class="text-[11.5px] font-semibold text-rc-muted" for="rc-days">Days</label> <select id="rc-days"></select></div></div> <div class="mt-3.5"><!></div>`, 1);
  var root_2$3 = /* @__PURE__ */ from_html(`<!> <!>`, 1);
  var root_3$3 = /* @__PURE__ */ from_html(`<span class="text-xs text-rc-dim">closed</span>`);
  var root_4$2 = /* @__PURE__ */ from_html(`<span class="inline-flex gap-[7px]"><!> <!></span>`);
  var root_5$2 = /* @__PURE__ */ from_html(`<tr><td style="font-family:var(--font-rc-mono)"> </td><td> </td><td> </td><td><!></td><td><!></td></tr>`);
  var root_6 = /* @__PURE__ */ from_html(`<table class="w-full border-collapse"><thead><tr><th>Environment</th><th>Team</th><th>Expires</th><th>State</th><th></th></tr></thead><tbody></tbody></table>`);
  var root_7 = /* @__PURE__ */ from_html(`<!> <!> <!>`, 1);
  function Leases($$anchor, $$props) {
    push($$props, true);
    const free = /* @__PURE__ */ user_derived(() => $$props.fleet.environments.filter((e) => e.env_state === "available"));
    let envUuid = /* @__PURE__ */ state("");
    let team = /* @__PURE__ */ state("");
    let purpose = /* @__PURE__ */ state("");
    let days = /* @__PURE__ */ state("3");
    let busy = /* @__PURE__ */ state(false);
    user_effect(() => {
      if (!get(envUuid) && get(free).length) set(envUuid, get(free)[0].uuid, true);
    });
    const field = "mt-1.5 w-full rounded-[7px] border border-rc-line bg-rc-panel2 px-2.5 py-2 text-[13px] text-rc-text outline-none";
    const TH = "px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line";
    const TD = "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line";
    async function claim() {
      if (!get(envUuid) || !get(team).trim()) {
        toast("Pick an environment and name your team.", "error");
        return;
      }
      set(busy, true);
      const env = byUuid($$props.fleet.environments, get(envUuid));
      const now = /* @__PURE__ */ new Date();
      const expires = new Date(now.getTime() + parseInt(get(days), 10) * 864e5);
      try {
        const res = await createWithRefs(
          "lease",
          {
            display_name: `${env?.display_name ?? "environment"} · ${get(team).trim()}`,
            description: get(purpose).trim() || "Environment lease.",
            environment_uuid: get(envUuid),
            team: get(team).trim(),
            requested_by: me(),
            owner_username: me(),
            purpose: get(purpose).trim(),
            claimed_at: now.toISOString(),
            expires_at: expires.toISOString(),
            lease_state: "active",
            release_attempts: 0
          },
          [{ ref_name: "Environment", ref_uuid: get(envUuid) }]
        );
        if (res?.refErrors?.length) toast("Lease created, but the environment link failed.", "warning");
        try {
          await update(
            "environment",
            get(envUuid),
            {
              env_state: "claimed",
              observed_allocation: "allocated",
              current_holder: me(),
              current_team: get(team).trim()
            },
            env ?? void 0
          );
          toast("Environment claimed.", "success");
        } catch {
          toast("Lease recorded. The environment flips to claimed when the reconciler next runs.", "info");
        }
        set(team, "");
        set(purpose, "");
        $$props.reload();
      } catch (e) {
        toast("Claim failed: " + (e instanceof Error ? e.message : "unknown error"), "error");
      } finally {
        set(busy, false);
      }
    }
    async function release(l) {
      const env = byUuid($$props.fleet.environments, l.environment_uuid ?? "");
      if (!env) {
        toast("That environment is not visible to you.", "error");
        return;
      }
      try {
        await act(
          "release_lease",
          {
            lease_uuid: l.uuid,
            environment_uuid: env.uuid,
            observed: env.observed_allocation,
            env_label: env.display_name || env.name
          },
          async () => {
            const freed = env.observed_allocation === "free";
            await update(
              "lease",
              l.uuid,
              freed ? { lease_state: "released" } : {
                lease_state: "release_failed",
                last_release_error: "cluster still reports the namespace allocated at release time"
              },
              l
            );
          }
        );
        if (env.observed_allocation === "free") toast("Environment released.", "success");
        else toast("Release did not complete — the cluster still reports it allocated. A finding was opened.", "warning");
        $$props.reload();
      } catch (e) {
        toast("Release failed: " + (e instanceof Error ? e.message : "unknown"), "error");
      }
    }
    async function extend(l) {
      const next = new Date(new Date(l.expires_at ?? Date.now()).getTime() + 3 * 864e5);
      try {
        await update("lease", l.uuid, { expires_at: next.toISOString(), lease_state: "active" }, l);
        toast("Extended by three days.", "success");
        $$props.reload();
      } catch (e) {
        toast("Extend failed: " + (e instanceof Error ? e.message : "unknown"), "error");
      }
    }
    var fragment = root_7();
    var node = first_child(fragment);
    SectionTitle(node, {
      title: "My leases",
      sub: "Leases you hold. Others’ leases are filtered out by the server, not by this page."
    });
    var node_1 = sibling(node, 2);
    Panel(node_1, {
      children: ($$anchor2, $$slotProps) => {
        var fragment_1 = comment();
        var node_2 = first_child(fragment_1);
        {
          var consequent = ($$anchor3) => {
            var fragment_2 = root_1$3();
            var node_3 = first_child(fragment_2);
            SectionTitle(node_3, {
              title: "Claim an environment",
              sub: "Creating a lease marks the environment claimed server-side."
            });
            var div = sibling(node_3, 2);
            var div_1 = child(div);
            var select = sibling(child(div_1), 2);
            set_class(select, 1, clsx(field));
            each(select, 21, () => get(free), (e) => e.uuid, ($$anchor4, e) => {
              var option = root$3();
              var text2 = only_child(option);
              var option_value = {};
              template_effect(() => {
                set_text(text2, `${(get(e).display_name || get(e).name) ?? ""} — ${get(e).namespace_path ?? ""}`);
                if (option_value !== (option_value = get(e).uuid)) {
                  option.value = (option.__value = option_value) ?? "";
                }
              });
              append($$anchor4, option);
            });
            init_select(select);
            var div_2 = sibling(div_1, 2);
            var input = sibling(child(div_2), 2);
            set_class(input, 1, clsx(field));
            var div_3 = sibling(div_2, 2);
            var input_1 = sibling(child(div_3), 2);
            set_class(input_1, 1, clsx(field));
            var div_4 = sibling(div_3, 2);
            var select_1 = sibling(child(div_4), 2);
            set_class(select_1, 1, clsx(field));
            each(select_1, 20, () => ["1", "3", "7", "14"], (d) => d, ($$anchor4, d) => {
              var option_1 = root$3();
              var text_1 = only_child(option_1, true);
              var option_1_value = {};
              template_effect(() => {
                set_text(text_1, d);
                if (option_1_value !== (option_1_value = d)) {
                  option_1.value = (option_1.__value = option_1_value) ?? "";
                }
              });
              append($$anchor4, option_1);
            });
            init_select(select_1);
            var div_5 = sibling(div, 2);
            var node_4 = child(div_5);
            Btn(node_4, {
              get disabled() {
                return get(busy);
              },
              onclick: claim,
              children: ($$anchor4, $$slotProps2) => {
                var text_2 = text();
                template_effect(() => set_text(text_2, get(busy) ? "Claiming…" : "Claim environment"));
                append($$anchor4, text_2);
              },
              $$slots: { default: true }
            });
            bind_select_value(select, () => get(envUuid), ($$value) => set(envUuid, $$value));
            bind_value(input, () => get(team), ($$value) => set(team, $$value));
            bind_value(input_1, () => get(purpose), ($$value) => set(purpose, $$value));
            bind_select_value(select_1, () => get(days), ($$value) => set(days, $$value));
            append($$anchor3, fragment_2);
          };
          var alternate = ($$anchor3) => {
            var fragment_4 = root_2$3();
            var node_5 = first_child(fragment_4);
            SectionTitle(node_5, { title: "Claim an environment" });
            var node_6 = sibling(node_5, 2);
            Empty(node_6, {
              children: ($$anchor4, $$slotProps2) => {
                var text_3 = text("Nothing is available in this organisation right now.");
                append($$anchor4, text_3);
              }
            });
            append($$anchor3, fragment_4);
          };
          if_block(node_2, ($$render) => {
            if (get(free).length) $$render(consequent);
            else $$render(alternate, -1);
          });
        }
        append($$anchor2, fragment_1);
      },
      $$slots: { default: true }
    });
    var node_7 = sibling(node_1, 2);
    Panel(node_7, {
      pad: "p-0",
      children: ($$anchor2, $$slotProps) => {
        var fragment_5 = comment();
        var node_8 = first_child(fragment_5);
        {
          var consequent_2 = ($$anchor3) => {
            var table = root_6();
            var thead = child(table);
            var tr = child(thead);
            var th = child(tr);
            set_class(th, 1, clsx(TH));
            var th_1 = sibling(th);
            set_class(th_1, 1, clsx(TH));
            var th_2 = sibling(th_1);
            set_class(th_2, 1, clsx(TH));
            var th_3 = sibling(th_2);
            set_class(th_3, 1, clsx(TH));
            var th_4 = sibling(th_3);
            set_class(th_4, 1, clsx(TH));
            var tbody = sibling(thead);
            each(tbody, 21, () => $$props.fleet.leases, (l) => l.uuid, ($$anchor4, l) => {
              const env = /* @__PURE__ */ user_derived(() => byUuid($$props.fleet.environments, get(l).environment_uuid ?? ""));
              const done = /* @__PURE__ */ user_derived(() => get(l).lease_state === "released" || get(l).lease_state === "force_reclaimed");
              var tr_1 = root_5$2();
              var td = child(tr_1);
              set_class(td, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px]");
              var text_4 = only_child(td, true);
              var td_1 = sibling(td);
              set_class(td_1, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
              var text_5 = only_child(td_1, true);
              var td_2 = sibling(td_1);
              set_class(td_2, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
              var text_6 = only_child(td_2, true);
              var td_3 = sibling(td_2);
              set_class(td_3, 1, clsx(TD));
              var node_9 = child(td_3);
              {
                let $0 = /* @__PURE__ */ user_derived(() => leaseTone(get(l).lease_state));
                Pill(node_9, {
                  get tone() {
                    return get($0);
                  },
                  children: ($$anchor5, $$slotProps2) => {
                    var text_7 = text();
                    template_effect(() => set_text(text_7, get(l).lease_state));
                    append($$anchor5, text_7);
                  }
                });
              }
              var td_4 = sibling(td_3);
              set_class(td_4, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line whitespace-nowrap text-right");
              var node_10 = child(td_4);
              {
                var consequent_1 = ($$anchor5) => {
                  var span = root_3$3();
                  append($$anchor5, span);
                };
                var alternate_1 = ($$anchor5) => {
                  var span_1 = root_4$2();
                  var node_11 = child(span_1);
                  Btn(node_11, {
                    small: true,
                    ghost: true,
                    onclick: () => extend(get(l)),
                    children: ($$anchor6, $$slotProps2) => {
                      var text_8 = text("+3d");
                      append($$anchor6, text_8);
                    },
                    $$slots: { default: true }
                  });
                  var node_12 = sibling(node_11, 2);
                  Btn(node_12, {
                    small: true,
                    onclick: () => release(get(l)),
                    children: ($$anchor6, $$slotProps2) => {
                      var text_9 = text("Release");
                      append($$anchor6, text_9);
                    },
                    $$slots: { default: true }
                  });
                  append($$anchor5, span_1);
                };
                if_block(node_10, ($$render) => {
                  if (get(done)) $$render(consequent_1);
                  else $$render(alternate_1, -1);
                });
              }
              template_effect(
                ($0) => {
                  set_text(text_4, get(env) ? get(env).display_name || get(env).name : "—");
                  set_text(text_5, get(l).team);
                  set_text(text_6, $0);
                },
                [() => until(get(l).expires_at)]
              );
              append($$anchor4, tr_1);
            });
            append($$anchor3, table);
          };
          var alternate_2 = ($$anchor3) => {
            Empty($$anchor3, {
              children: ($$anchor4, $$slotProps2) => {
                var text_10 = text("You hold no leases.");
                append($$anchor4, text_10);
              }
            });
          };
          if_block(node_8, ($$render) => {
            if ($$props.fleet.leases.length) $$render(consequent_2);
            else $$render(alternate_2, -1);
          });
        }
        append($$anchor2, fragment_5);
      },
      $$slots: { default: true }
    });
    append($$anchor, fragment);
    pop();
  }
  var root$2 = /* @__PURE__ */ from_html(`<span class="italic text-rc-dim">hidden</span>`);
  var root_1$2 = /* @__PURE__ */ from_html(`<tr class="cursor-pointer"><td><div class="text-[13px] font-semibold"> </div> <div class="mt-0.5 text-[11.5px] text-rc-dim"> </div></td><td><!></td><td><!></td><td><!></td></tr>`);
  var root_2$2 = /* @__PURE__ */ from_html(`<table class="w-full border-collapse"><thead><tr><th>Finding</th><th>State</th><th>Evidence</th><th>Wasted</th></tr></thead><tbody></tbody></table>`);
  var root_3$2 = /* @__PURE__ */ from_html(`<tr class="cursor-pointer"><td><div class="text-[13px]"> </div> <div class="mt-0.5 text-[11.5px] text-rc-dim"> </div></td><td><!></td></tr>`);
  var root_4$1 = /* @__PURE__ */ from_html(`<div class="border-b border-rc-line px-3.5 py-3 text-xs text-rc-muted">Resolved</div> <table class="w-full border-collapse"><tbody></tbody></table>`, 1);
  var root_5$1 = /* @__PURE__ */ from_html(`<!> <!> <!>`, 1);
  function DriftQueue($$anchor, $$props) {
    push($$props, true);
    const closed = /* @__PURE__ */ user_derived(() => $$props.fleet.findings.filter((f) => f.finding_state === "resolved" || f.finding_state === "rejected"));
    const open = /* @__PURE__ */ user_derived(() => $$props.fleet.findings.filter((f) => !get(closed).includes(f)));
    const TH = "px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line";
    const TD = "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line";
    var fragment = root_5$1();
    var node = first_child(fragment);
    SectionTitle(node, {
      title: "Drift queue",
      sub: "Each of these is a disagreement with no clean answer. Someone has to choose."
    });
    var node_1 = sibling(node, 2);
    Panel(node_1, {
      pad: "p-0",
      children: ($$anchor2, $$slotProps) => {
        var fragment_1 = comment();
        var node_2 = first_child(fragment_1);
        {
          var consequent_2 = ($$anchor3) => {
            var table = root_2$2();
            var thead = child(table);
            var tr = child(thead);
            var th = child(tr);
            set_class(th, 1, clsx(TH));
            var th_1 = sibling(th);
            set_class(th_1, 1, clsx(TH));
            var th_2 = sibling(th_1);
            set_class(th_2, 1, clsx(TH));
            var th_3 = sibling(th_2);
            set_class(th_3, 1, clsx(TH));
            var tbody = sibling(thead);
            each(tbody, 21, () => get(open), (f) => f.uuid, ($$anchor4, f) => {
              const s = /* @__PURE__ */ user_derived(() => staleness(envCluster(byUuid($$props.fleet.environments, get(f).environment_uuid ?? ""), $$props.fleet.clusters), $$props.fleet.policy));
              var tr_1 = root_1$2();
              var td = child(tr_1);
              set_class(td, 1, clsx(TD));
              var div = child(td);
              var text$1 = only_child(div, true);
              var div_1 = sibling(div, 2);
              var text_1 = only_child(div_1);
              var td_1 = sibling(td);
              set_class(td_1, 1, clsx(TD));
              var node_3 = child(td_1);
              {
                let $0 = /* @__PURE__ */ user_derived(() => findingTone(get(f).finding_state));
                Pill(node_3, {
                  get tone() {
                    return get($0);
                  },
                  children: ($$anchor5, $$slotProps2) => {
                    var text_2 = text();
                    template_effect(() => set_text(text_2, get(f).finding_state));
                    append($$anchor5, text_2);
                  }
                });
              }
              var td_2 = sibling(td_1);
              set_class(td_2, 1, clsx(TD));
              var node_4 = child(td_2);
              {
                var consequent = ($$anchor5) => {
                  Pill($$anchor5, {
                    get tone() {
                      return C.bad;
                    },
                    children: ($$anchor6, $$slotProps2) => {
                      var text_3 = text("observation stale");
                      append($$anchor6, text_3);
                    }
                  });
                };
                var alternate = ($$anchor5) => {
                  Pill($$anchor5, {
                    get tone() {
                      return C.ok;
                    },
                    children: ($$anchor6, $$slotProps2) => {
                      var text_4 = text("observation fresh");
                      append($$anchor6, text_4);
                    }
                  });
                };
                if_block(node_4, ($$render) => {
                  if (get(s).stale) $$render(consequent);
                  else $$render(alternate, -1);
                });
              }
              var td_3 = sibling(td_2);
              set_class(td_3, 1, "px-3 py-2.5 text-[13px] align-middle border-b border-rc-line text-[12.5px] text-rc-muted");
              var node_5 = child(td_3);
              {
                var consequent_1 = ($$anchor5) => {
                  var span = root$2();
                  append($$anchor5, span);
                };
                var alternate_1 = ($$anchor5) => {
                  var text_5 = text();
                  template_effect(($0) => set_text(text_5, `$${$0 ?? ""}`), [() => Math.round(num(get(f).wasted_cost_usd))]);
                  append($$anchor5, text_5);
                };
                if_block(node_5, ($$render) => {
                  if (get(f).wasted_cost_usd === void 0) $$render(consequent_1);
                  else $$render(alternate_1, -1);
                });
              }
              template_effect(
                ($0) => {
                  set_text(text$1, get(f).display_name);
                  set_text(text_1, `detected ${$0 ?? ""}`);
                },
                [() => relative(get(f).detected_at)]
              );
              delegated("click", tr_1, () => navigate("#/drift/" + get(f).uuid));
              append($$anchor4, tr_1);
            });
            append($$anchor3, table);
          };
          var alternate_2 = ($$anchor3) => {
            Empty($$anchor3, {
              children: ($$anchor4, $$slotProps2) => {
                var text_6 = text("Nothing in dispute. Record and cluster agree everywhere.");
                append($$anchor4, text_6);
              }
            });
          };
          if_block(node_2, ($$render) => {
            if (get(open).length) $$render(consequent_2);
            else $$render(alternate_2, -1);
          });
        }
        append($$anchor2, fragment_1);
      },
      $$slots: { default: true }
    });
    var node_6 = sibling(node_1, 2);
    {
      var consequent_3 = ($$anchor2) => {
        Panel($$anchor2, {
          pad: "p-0",
          children: ($$anchor3, $$slotProps) => {
            var fragment_8 = root_4$1();
            var table_1 = sibling(first_child(fragment_8), 2);
            var tbody_1 = child(table_1);
            each(tbody_1, 21, () => get(closed), (f) => f.uuid, ($$anchor4, f) => {
              var tr_2 = root_3$2();
              var td_4 = child(tr_2);
              set_class(td_4, 1, clsx(TD));
              var div_2 = child(td_4);
              var text_7 = only_child(div_2, true);
              var div_3 = sibling(div_2, 2);
              var text_8 = only_child(div_3);
              var td_5 = sibling(td_4);
              set_class(td_5, 1, clsx(TD));
              var node_7 = child(td_5);
              {
                let $0 = /* @__PURE__ */ user_derived(() => findingTone(get(f).finding_state));
                Pill(node_7, {
                  get tone() {
                    return get($0);
                  },
                  children: ($$anchor5, $$slotProps2) => {
                    var text_9 = text();
                    template_effect(() => set_text(text_9, get(f).finding_state));
                    append($$anchor5, text_9);
                  }
                });
              }
              template_effect(
                ($0) => {
                  set_text(text_7, get(f).display_name);
                  set_text(text_8, `${get(f).resolution ?? ""} · ${$0 ?? ""}`);
                },
                [() => relative(get(f).approved_at)]
              );
              delegated("click", tr_2, () => navigate("#/drift/" + get(f).uuid));
              append($$anchor4, tr_2);
            });
            append($$anchor3, fragment_8);
          },
          $$slots: { default: true }
        });
      };
      if_block(node_6, ($$render) => {
        if (get(closed).length) $$render(consequent_3);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  delegate(["click"]);
  var root$1 = /* @__PURE__ */ from_html(` <strong class="text-rc-text"> </strong> `, 1);
  var root_1$1 = /* @__PURE__ */ from_html(`<div class="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Note on record</div> <div class="text-[13px] leading-relaxed text-rc-text"> </div>`, 1);
  var root_2$1 = /* @__PURE__ */ from_html(`<div class="mt-2.5 border-t border-rc-line pt-2.5 text-xs leading-relaxed"> </div>`);
  var root_3$1 = /* @__PURE__ */ from_html(`<div class="mb-2.5 rounded-[9px] border border-rc-line p-3.5"><div class="flex flex-wrap items-start justify-between gap-3"><div class="flex-[1_1_240px]"><div class="text-[13.5px] font-bold"> </div> <div class="mt-1 text-[12.5px] leading-relaxed text-rc-muted"> </div></div> <!></div> <!></div>`);
  var root_4 = /* @__PURE__ */ from_html(`<!> <textarea rows="2" placeholder="Why this decision? Recorded against the finding." class="mb-3.5 w-full resize-y rounded-[7px] border border-rc-line bg-rc-panel2 px-[11px] py-2.5 text-[13px] text-rc-text outline-none"></textarea> <!>`, 1);
  var root_5 = /* @__PURE__ */ from_html(`<a href="#/drift" class="mb-3 inline-block text-[12.5px] text-rc-dim">&larr; Drift queue</a> <!> <div class="mb-4 flex flex-wrap gap-3.5"><!> <!> <!> <!></div> <!> <!> <!> <!> <!>`, 1);
  function DriftDetail($$anchor, $$props) {
    push($$props, true);
    let note = /* @__PURE__ */ state("");
    let busy = /* @__PURE__ */ state(false);
    const f = /* @__PURE__ */ user_derived(() => byUuid($$props.fleet.findings, $$props.uuid));
    const env = /* @__PURE__ */ user_derived(() => get(f) ? byUuid($$props.fleet.environments, get(f).environment_uuid ?? "") : null);
    const cluster = /* @__PURE__ */ user_derived(() => envCluster(get(env), $$props.fleet.clusters));
    const stale = /* @__PURE__ */ user_derived(() => staleness(get(cluster), $$props.fleet.policy));
    const dual = /* @__PURE__ */ user_derived(() => Boolean($$props.fleet.policy?.require_dual_approval));
    const awaiting = /* @__PURE__ */ user_derived(() => get(f)?.finding_state === "awaiting_second_approval");
    const closed = /* @__PURE__ */ user_derived(() => get(f)?.finding_state === "resolved" || get(f)?.finding_state === "rejected");
    const isRequester = /* @__PURE__ */ user_derived(() => Boolean(get(awaiting) && get(f)?.requested_by === me()));
    function optionState(o) {
      if (get(closed)) return { blocked: true, label: "Closed", reason: "" };
      if (o.destructive && get(stale).stale) {
        return {
          blocked: true,
          label: "Unavailable",
          reason: `Withheld: ${get(stale).why} Reclaim cannot tell whether this workload is still running or the cluster is simply unreachable, and will not destroy it on a guess. Restore observation of this cluster, or escalate.`
        };
      }
      if (get(awaiting) && o.id !== get(f)?.resolution) {
        return {
          blocked: true,
          label: "Unavailable",
          reason: `A different resolution (${get(f)?.resolution}) is already pending a second approval. Reject that first.`
        };
      }
      if (get(awaiting) && get(isRequester)) {
        return {
          blocked: true,
          label: "Awaiting a second approver",
          reason: "You requested this resolution. This organisation requires a second person to approve it."
        };
      }
      if (get(awaiting)) return { blocked: false, label: "Approve and execute", reason: "" };
      if (get(dual) && o.destructive) return {
        blocked: false,
        label: "Request approval",
        reason: "",
        request: true
      };
      return { blocked: false, label: "Apply", reason: "" };
    }
    async function requestApproval(o) {
      if (!get(f)) return;
      set(busy, true);
      try {
        await update(
          "drift_finding",
          get(f).uuid,
          {
            finding_state: "awaiting_second_approval",
            resolution: o.id,
            requested_by: me(),
            requested_at: (/* @__PURE__ */ new Date()).toISOString(),
            resolution_note: get(note).trim()
          },
          get(f)
        );
        toast("Requested. A second approver must confirm.", "success");
        $$props.reload();
      } catch (e) {
        toast("Could not record the request: " + (e instanceof Error ? e.message : ""), "error");
      } finally {
        set(busy, false);
      }
    }
    async function applyNow(o) {
      if (!get(f)) return;
      set(busy, true);
      try {
        if (get(note).trim()) await update("drift_finding", get(f).uuid, { resolution_note: get(note).trim() }, get(f));
        await act(
          "apply_drift_resolution",
          {
            finding_uuid: get(f).uuid,
            environment_uuid: get(f).environment_uuid,
            resolution: o.id,
            approver: me()
          },
          async () => {
            const envPatch = o.id === "force_reclaim" ? {
              env_state: "available",
              observed_allocation: "free",
              current_holder: "",
              current_team: ""
            } : { env_state: "quarantined" };
            if (get(f).environment_uuid) await update("environment", get(f).environment_uuid, envPatch, get(env) ?? void 0);
            await update(
              "drift_finding",
              get(f).uuid,
              {
                finding_state: "resolved",
                resolution: o.id,
                approved_by: me(),
                approved_at: (/* @__PURE__ */ new Date()).toISOString()
              },
              get(f)
            );
          }
        );
        toast(o.label + " applied.", "success");
        $$props.reload();
      } catch (e) {
        toast("Could not apply: " + (e instanceof Error ? e.message : "unknown"), "error");
      } finally {
        set(busy, false);
      }
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        Empty($$anchor2, {
          children: ($$anchor3, $$slotProps) => {
            var text$1 = text("That finding is not in this organisation.");
            append($$anchor3, text$1);
          }
        });
      };
      var alternate = ($$anchor2) => {
        var fragment_2 = root_5();
        var node_1 = sibling(first_child(fragment_2), 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(f).display_name ?? "");
          let $1 = /* @__PURE__ */ user_derived(() => get(env)?.namespace_path ?? "environment not visible");
          SectionTitle(node_1, {
            get title() {
              return get($0);
            },
            get sub() {
              return get($1);
            }
          });
        }
        var div = sibling(node_1, 2);
        var node_2 = child(div);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(f).claimed_allocation ?? "—");
          Metric(node_2, {
            label: "Record says",
            get value() {
              return get($0);
            }
          });
        }
        var node_3 = sibling(node_2, 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(f).observed_allocation ?? "—");
          let $1 = /* @__PURE__ */ user_derived(() => get(f).observed_allocation === "unknown" ? C.bad : C.cyan);
          Metric(node_3, {
            label: "Cluster said",
            get value() {
              return get($0);
            },
            get tone() {
              return get($1);
            }
          });
        }
        var node_4 = sibling(node_3, 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(cluster) ? relative(get(cluster).last_observed_at) : "n/a");
          let $1 = /* @__PURE__ */ user_derived(() => get(stale).stale ? C.bad : C.ok);
          Metric(node_4, {
            label: "Observation age",
            get value() {
              return get($0);
            },
            get tone() {
              return get($1);
            },
            get sub() {
              return `window is ${get(stale).limit ?? ""}m`;
            }
          });
        }
        var node_5 = sibling(node_4, 2);
        {
          let $0 = /* @__PURE__ */ user_derived(() => get(f).severity ?? "—");
          let $1 = /* @__PURE__ */ user_derived(() => get(f).severity === "high" ? C.bad : C.warn);
          Metric(node_5, {
            label: "Severity",
            get value() {
              return get($0);
            },
            get tone() {
              return get($1);
            }
          });
        }
        var node_6 = sibling(div, 2);
        {
          var consequent_1 = ($$anchor3) => {
            Banner($$anchor3, {
              get tone() {
                return C.bad;
              },
              title: "Destructive actions withheld",
              children: ($$anchor4, $$slotProps) => {
                var text_1 = text();
                template_effect(() => set_text(text_1, `${get(stale).why ?? ""} A force reclaim here would be a guess, and the guess that loses is the one where the
      cluster was reachable all along and the workload was live.`));
                append($$anchor4, text_1);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_6, ($$render) => {
            if (get(stale).stale && !get(closed)) $$render(consequent_1);
          });
        }
        var node_7 = sibling(node_6, 2);
        {
          var consequent_2 = ($$anchor3) => {
            Banner($$anchor3, {
              get tone() {
                return C.warn;
              },
              title: "Awaiting a second approval",
              children: ($$anchor4, $$slotProps) => {
                var fragment_6 = root$1();
                var text_2 = first_child(fragment_6);
                var strong = sibling(text_2);
                var text_3 = only_child(strong, true);
                var text_4 = sibling(strong);
                template_effect(
                  ($0) => {
                    set_text(text_2, `${get(f).resolution ?? ""} was requested by `);
                    set_text(text_3, get(f).requested_by || "an admin");
                    set_text(text_4, ` ${$0 ?? ""}.
      ${get(isRequester) ? "You cannot approve your own request." : "You may approve it."}`);
                  },
                  [() => relative(get(f).requested_at)]
                );
                append($$anchor4, fragment_6);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_7, ($$render) => {
            if (get(awaiting)) $$render(consequent_2);
          });
        }
        var node_8 = sibling(node_7, 2);
        {
          var consequent_3 = ($$anchor3) => {
            Banner($$anchor3, {
              get tone() {
                return C.ok;
              },
              title: "Resolved",
              children: ($$anchor4, $$slotProps) => {
                var text_5 = text();
                template_effect(($0) => set_text(text_5, `${get(f).resolution ?? ""} by ${(get(f).approved_by || "an admin") ?? ""} ${$0 ?? ""}.`), [() => relative(get(f).approved_at)]);
                append($$anchor4, text_5);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_8, ($$render) => {
            if (get(closed)) $$render(consequent_3);
          });
        }
        var node_9 = sibling(node_8, 2);
        {
          var consequent_4 = ($$anchor3) => {
            Panel($$anchor3, {
              children: ($$anchor4, $$slotProps) => {
                var fragment_10 = root_1$1();
                var div_1 = sibling(first_child(fragment_10), 2);
                var text_6 = only_child(div_1, true);
                template_effect(() => set_text(text_6, get(f).resolution_note));
                append($$anchor4, fragment_10);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_9, ($$render) => {
            if (get(f).resolution_note) $$render(consequent_4);
          });
        }
        var node_10 = sibling(node_9, 2);
        {
          var consequent_6 = ($$anchor3) => {
            Panel($$anchor3, {
              children: ($$anchor4, $$slotProps) => {
                var fragment_12 = root_4();
                var node_11 = first_child(fragment_12);
                SectionTitle(node_11, {
                  title: "Resolve",
                  sub: "Three options, none of them clean. Pick the one you can defend, and say why."
                });
                var textarea = sibling(node_11, 2);
                var node_12 = sibling(textarea, 2);
                each(node_12, 17, () => RESOLUTIONS, (o) => o.id, ($$anchor5, o) => {
                  const st = /* @__PURE__ */ user_derived(() => optionState(get(o)));
                  var div_2 = root_3$1();
                  var div_3 = child(div_2);
                  var div_4 = child(div_3);
                  var div_5 = child(div_4);
                  var text_7 = only_child(div_5, true);
                  var div_6 = sibling(div_5, 2);
                  var text_8 = only_child(div_6, true);
                  var node_13 = sibling(div_4, 2);
                  {
                    let $0 = /* @__PURE__ */ user_derived(() => get(st).blocked || get(busy));
                    let $1 = /* @__PURE__ */ user_derived(() => get(o).destructive ? C.bad : C.cyan);
                    let $2 = /* @__PURE__ */ user_derived(() => !get(o).destructive);
                    Btn(node_13, {
                      small: true,
                      get disabled() {
                        return get($0);
                      },
                      get tone() {
                        return get($1);
                      },
                      get ghost() {
                        return get($2);
                      },
                      onclick: () => get(st).request ? requestApproval(get(o)) : applyNow(get(o)),
                      children: ($$anchor6, $$slotProps2) => {
                        var text_9 = text();
                        template_effect(() => set_text(text_9, get(st).label));
                        append($$anchor6, text_9);
                      },
                      $$slots: { default: true }
                    });
                  }
                  var node_14 = sibling(div_3, 2);
                  {
                    var consequent_5 = ($$anchor6) => {
                      var div_7 = root_2$1();
                      var text_10 = only_child(div_7, true);
                      template_effect(() => {
                        set_style(div_7, `color:${C.warn}`);
                        set_text(text_10, get(st).reason);
                      });
                      append($$anchor6, div_7);
                    };
                    if_block(node_14, ($$render) => {
                      if (get(st).blocked && get(st).reason) $$render(consequent_5);
                    });
                  }
                  template_effect(() => {
                    set_style(div_2, `background:${(get(st).blocked ? C.panel2 : C.panel) ?? ""};opacity:${get(st).blocked ? 0.75 : 1}`);
                    set_style(div_5, `color:${(get(o).destructive ? C.bad : C.text) ?? ""}`);
                    set_text(text_7, get(o).label);
                    set_text(text_8, get(o).blurb);
                  });
                  append($$anchor5, div_2);
                });
                bind_value(textarea, () => get(note), ($$value) => set(note, $$value));
                append($$anchor4, fragment_12);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_10, ($$render) => {
            if (!get(closed)) $$render(consequent_6);
          });
        }
        append($$anchor2, fragment_2);
      };
      if_block(node, ($$render) => {
        if (!get(f)) $$render(consequent);
        else $$render(alternate, -1);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  var root = /* @__PURE__ */ from_html(`<div class="flex flex-wrap items-center justify-between gap-3.5"><div class="flex-[1_1_300px]"><div class="text-sm font-bold">Require a second approver for force reclaim</div> <div class="mt-1.5 text-[12.5px] leading-relaxed text-rc-muted">When on, destroying a disputed environment needs two different admins. Off by default &mdash;
          and safe to be a flag, because turning it on changes only the next decision. Nothing already
          recorded becomes wrong.</div></div> <!></div>`);
  var root_1 = /* @__PURE__ */ from_html(`<div class="mb-1.5 text-sm font-bold">Staleness window</div> <div class="text-[12.5px] leading-relaxed text-rc-muted"> </div>`, 1);
  var root_2 = /* @__PURE__ */ from_html(
    `<div class="mb-1.5 text-sm font-bold">Why tenancy is not on this page</div> <div class="text-[12.5px] leading-relaxed text-rc-muted">Whether organisations are isolated from one another is not a setting here, and deliberately so.
      A flag is only honest when turning it on later is cheap. An approval gate qualifies. Isolation
      does not &mdash; retrofitting it rewrites every query, every policy and the login path &mdash;
      so it is structural and always on.</div>`,
    1
  );
  var root_3 = /* @__PURE__ */ from_html(`<!> <!> <!> <!>`, 1);
  function Policy($$anchor, $$props) {
    push($$props, true);
    let busy = /* @__PURE__ */ state(false);
    async function toggle() {
      const p = $$props.fleet.policy;
      if (!p) return;
      set(busy, true);
      try {
        await update("fleet_policy", p.uuid, { require_dual_approval: !p.require_dual_approval }, p);
        toast("Policy updated.", "success");
        $$props.reload();
      } catch (e) {
        toast("Update failed: " + (e instanceof Error ? e.message : ""), "error");
      } finally {
        set(busy, false);
      }
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent = ($$anchor2) => {
        Empty($$anchor2, {
          children: ($$anchor3, $$slotProps) => {
            var text$1 = text("No policy row for this organisation.");
            append($$anchor3, text$1);
          }
        });
      };
      var alternate = ($$anchor2) => {
        const p = /* @__PURE__ */ user_derived(() => $$props.fleet.policy);
        var fragment_2 = root_3();
        var node_1 = first_child(fragment_2);
        SectionTitle(node_1, {
          title: "Fleet policy",
          sub: "Safety settings for this organisation."
        });
        var node_2 = sibling(node_1, 2);
        Panel(node_2, {
          children: ($$anchor3, $$slotProps) => {
            var div = root();
            var node_3 = sibling(child(div), 2);
            {
              let $0 = /* @__PURE__ */ user_derived(() => get(p).require_dual_approval ? C.ok : C.mut);
              let $1 = /* @__PURE__ */ user_derived(() => !get(p).require_dual_approval);
              Btn(node_3, {
                get disabled() {
                  return get(busy);
                },
                get tone() {
                  return get($0);
                },
                get ghost() {
                  return get($1);
                },
                onclick: toggle,
                children: ($$anchor4, $$slotProps2) => {
                  var text_1 = text();
                  template_effect(() => set_text(text_1, get(p).require_dual_approval ? "On" : "Off"));
                  append($$anchor4, text_1);
                },
                $$slots: { default: true }
              });
            }
            append($$anchor3, div);
          },
          $$slots: { default: true }
        });
        var node_4 = sibling(node_2, 2);
        Panel(node_4, {
          children: ($$anchor3, $$slotProps) => {
            var fragment_4 = root_1();
            var div_1 = sibling(first_child(fragment_4), 2);
            var text_2 = only_child(div_1);
            template_effect(
              ($0, $1) => set_text(text_2, `An observation older than ${$0 ?? ""} minutes is not trusted for a
      destructive action. Grace period before an expired lease is auto-released:
      ${$1 ?? ""} minutes. Escalations go to
      ${(get(p).escalation_channel || "the on-call channel") ?? ""}.`),
              [
                () => num(get(p).stale_observation_minutes, 30),
                () => num(get(p).auto_release_grace_minutes)
              ]
            );
            append($$anchor3, fragment_4);
          },
          $$slots: { default: true }
        });
        var node_5 = sibling(node_4, 2);
        Panel(node_5, {
          children: ($$anchor3, $$slotProps) => {
            var fragment_5 = root_2();
            append($$anchor3, fragment_5);
          },
          $$slots: { default: true }
        });
        append($$anchor2, fragment_2);
      };
      if_block(node, ($$render) => {
        if (!$$props.fleet.policy) $$render(consequent);
        else $$render(alternate, -1);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  function App($$anchor, $$props) {
    push($$props, true);
    let route = /* @__PURE__ */ state(proxy(current()));
    let authed = /* @__PURE__ */ state(proxy(client.isAuthenticated()));
    let showLogin = /* @__PURE__ */ state(false);
    let tenant = /* @__PURE__ */ state("");
    let loaded = /* @__PURE__ */ state(proxy(EMPTY_FLEET));
    const fleet = /* @__PURE__ */ user_derived(() => scopeToTenant(get(loaded), get(tenant)));
    let loading = /* @__PURE__ */ state(true);
    let loadError = /* @__PURE__ */ state("");
    user_effect(() => onChange((r2) => {
      set(route, r2, true);
    }));
    user_effect(() => {
      if (client.isAuthenticated()) {
        set(authed, true);
        return;
      }
      let n = 0;
      const t = setInterval(
        () => {
          if (client.isAuthenticated()) {
            set(authed, true);
            clearInterval(t);
          } else if (++n > 25) clearInterval(t);
        },
        150
      );
      return () => clearInterval(t);
    });
    async function reload() {
      set(loading, true);
      set(loadError, "");
      try {
        set(loaded, await loadFleet(), true);
      } catch (e) {
        set(loadError, e instanceof Error ? e.message : "Could not load the fleet.", true);
      } finally {
        set(loading, false);
      }
    }
    user_effect(() => {
      if (get(authed)) {
        void get(tenant);
        void reload();
      }
    });
    function onTenant(name) {
      set(tenant, name, true);
    }
    function logout() {
      client.logout();
      set(authed, false);
      set(showLogin, false);
      navigate("#/");
    }
    var fragment = comment();
    var node = first_child(fragment);
    {
      var consequent_1 = ($$anchor2) => {
        var fragment_1 = comment();
        var node_1 = first_child(fragment_1);
        {
          var consequent = ($$anchor3) => {
            Login($$anchor3, {
              onDone: () => {
                set(authed, true);
                navigate("#/");
              },
              onBack: () => set(showLogin, false)
            });
          };
          var alternate = ($$anchor3) => {
            Landing($$anchor3, { onSignIn: () => set(showLogin, true) });
          };
          if_block(node_1, ($$render) => {
            if (get(showLogin)) $$render(consequent);
            else $$render(alternate, -1);
          });
        }
        append($$anchor2, fragment_1);
      };
      var alternate_4 = ($$anchor2) => {
        Shell($$anchor2, {
          get route() {
            return get(route).hash;
          },
          get tenant() {
            return get(tenant);
          },
          onTenant,
          onLogout: logout,
          children: ($$anchor3, $$slotProps) => {
            var fragment_5 = comment();
            var node_2 = first_child(fragment_5);
            {
              var consequent_2 = ($$anchor4) => {
                Empty($$anchor4, {
                  children: ($$anchor5, $$slotProps2) => {
                    var text$1 = text("Loading the fleet…");
                    append($$anchor5, text$1);
                  }
                });
              };
              var consequent_3 = ($$anchor4) => {
                Banner($$anchor4, {
                  get tone() {
                    return C.bad;
                  },
                  title: "Could not load",
                  children: ($$anchor5, $$slotProps2) => {
                    var text_1 = text();
                    template_effect(() => set_text(text_1, get(loadError)));
                    append($$anchor5, text_1);
                  },
                  $$slots: { default: true }
                });
              };
              var consequent_4 = ($$anchor4) => {
                Environments($$anchor4, {
                  get fleet() {
                    return get(fleet);
                  }
                });
              };
              var consequent_5 = ($$anchor4) => {
                EnvDetail($$anchor4, {
                  get fleet() {
                    return get(fleet);
                  },
                  get uuid() {
                    return get(route).arg;
                  }
                });
              };
              var consequent_6 = ($$anchor4) => {
                Leases($$anchor4, {
                  get fleet() {
                    return get(fleet);
                  },
                  reload
                });
              };
              var consequent_9 = ($$anchor4) => {
                var fragment_12 = comment();
                var node_3 = first_child(fragment_12);
                {
                  var consequent_7 = ($$anchor5) => {
                    Empty($$anchor5, {
                      children: ($$anchor6, $$slotProps2) => {
                        var text_2 = text("Resolving drift is limited to platform admins.");
                        append($$anchor6, text_2);
                      }
                    });
                  };
                  var d = /* @__PURE__ */ user_derived(() => !isStaff());
                  var consequent_8 = ($$anchor5) => {
                    DriftDetail($$anchor5, {
                      get fleet() {
                        return get(fleet);
                      },
                      get uuid() {
                        return get(route).arg;
                      },
                      reload
                    });
                  };
                  var alternate_1 = ($$anchor5) => {
                    DriftQueue($$anchor5, {
                      get fleet() {
                        return get(fleet);
                      }
                    });
                  };
                  if_block(node_3, ($$render) => {
                    if (get(d)) $$render(consequent_7);
                    else if (get(route).arg) $$render(consequent_8, 1);
                    else $$render(alternate_1, -1);
                  });
                }
                append($$anchor4, fragment_12);
              };
              var consequent_11 = ($$anchor4) => {
                var fragment_16 = comment();
                var node_4 = first_child(fragment_16);
                {
                  var consequent_10 = ($$anchor5) => {
                    Policy($$anchor5, {
                      get fleet() {
                        return get(fleet);
                      },
                      reload
                    });
                  };
                  var d_1 = /* @__PURE__ */ user_derived(() => isStaff());
                  var alternate_2 = ($$anchor5) => {
                    Empty($$anchor5, {
                      children: ($$anchor6, $$slotProps2) => {
                        var text_3 = text("Fleet policy is limited to platform admins.");
                        append($$anchor6, text_3);
                      }
                    });
                  };
                  if_block(node_4, ($$render) => {
                    if (get(d_1)) $$render(consequent_10);
                    else $$render(alternate_2, -1);
                  });
                }
                append($$anchor4, fragment_16);
              };
              var alternate_3 = ($$anchor4) => {
                Fleet($$anchor4, {
                  get fleet() {
                    return get(fleet);
                  }
                });
              };
              if_block(node_2, ($$render) => {
                if (get(loading)) $$render(consequent_2);
                else if (get(loadError)) $$render(consequent_3, 1);
                else if (get(route).head === "environments") $$render(consequent_4, 2);
                else if (get(route).head === "env") $$render(consequent_5, 3);
                else if (get(route).head === "leases") $$render(consequent_6, 4);
                else if (get(route).head === "drift") $$render(consequent_9, 5);
                else if (get(route).head === "policy") $$render(consequent_11, 6);
                else $$render(alternate_3, -1);
              });
            }
            append($$anchor3, fragment_5);
          },
          $$slots: { default: true }
        });
      };
      if_block(node, ($$render) => {
        if (!get(authed)) $$render(consequent_1);
        else $$render(alternate_4, -1);
      });
    }
    append($$anchor, fragment);
    pop();
  }
  function container() {
    let el = document.getElementById("reclaim-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "reclaim-root";
      document.body.appendChild(el);
    }
    return el;
  }
  mount(App, { target: container() });
})();
