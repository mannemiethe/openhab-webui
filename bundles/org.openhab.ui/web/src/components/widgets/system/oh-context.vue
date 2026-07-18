<template>
  <generic-widget-component
    v-for="(slotComponent, idx) in children"
    v-bind="$attrs"
    :key="'default-' + idx"
    :context="childrenContext(slotComponent)"
  />
</template>

<script>
import { f7 } from "framework7-vue";
import { mapStores } from "pinia";
import { nextTick, watch } from "vue";

import mixin from "../widget-mixin";
import { OhContextDefinition } from "@/assets/definitions/widgets/system";
import { useStatesStore } from "@/js/stores/useStatesStore";

const INVALID_ITEM_STORE_PROPS = new Set([
  "_keys",
  "__ob__",
  "toString",
  "undefined",
  "constructor",
  "getters",
  "effect",
  "_vm",
  "toJSON",
]);

function isTrackableItemStoreProp(prop) {
  return (
    typeof prop === "string" && !INVALID_ITEM_STORE_PROPS.has(prop) && !prop.startsWith("__v_")
  );
}

export default {
  inheritAttrs: false,
  mixins: [mixin],
  widget: OhContextDefinition,
  data() {
    return {
      varScope: (this.context.varScope || "varScope") + "-" + f7.utils.id(),
      const: {},
    };
  },
  computed: {
    children() {
      if (!this.context?.component?.slots?.default) return [];
      return this.context.component.slots.default;
    },
    fn() {
      if (!this.context?.component?.config) return {};
      let evalFunc = {};
      const sourceFunc = this.context.component.config.functions || {};
      console.debug("oh-context: sourceFunc =", sourceFunc);
      if (sourceFunc) {
        if (typeof sourceFunc !== "object") return {};
        for (const key in sourceFunc) {
          evalFunc[key] = this.evaluateExpression(key, sourceFunc[key]);
        }
      }
      console.debug("oh-context: evalFunc =", evalFunc);
      return evalFunc;
    },
    ...mapStores(useStatesStore),
  },
  methods: {
    childrenContext(childComp) {
      const ctx = this.childContext(childComp);
      const ctxFunctions = this.fn;
      if (this.context.fn) {
        for (const funcKey in this.context.fn) {
          if (!ctxFunctions[funcKey]) ctxFunctions[funcKey] = this.context.fn[funcKey];
        }
      }
      ctx.fn = ctxFunctions;

      ctx.const = {
        ...(this.context.const || {}),
        ...this.const,
      };

      if (typeof ctx.ctxVars !== "object") ctx.ctxVars = {};
      ctx.ctxVars[this.varScope] = this.ctxVars;

      return ctx;
    },
    collectPendingDefaultItems(evaluateDefaults) {
      const accessedItems = new Set();
      const sourceStore = this.context?.store || {};
      const trackingStore = new Proxy(sourceStore, {
        get(target, prop, receiver) {
          if (isTrackableItemStoreProp(prop)) accessedItems.add(prop);
          return Reflect.get(target, prop, receiver);
        },
      });

      evaluateDefaults({ ...this.context, store: trackingStore });

      return Array.from(accessedItems).filter((itemName) => {
        const state = this.statesStore.itemStates.get(itemName);
        return !state || state.state === "-";
      });
    },
  },
  beforeMount() {
    const evaluateDefaults = (evaluationContext = this.context) => {
      if (!this.context?.component?.config) return;

      this.const = {};
      const sourceConst = this.context.component.config.constants || {};
      if (sourceConst) {
        if (typeof sourceConst !== "object") return;
        for (const key in sourceConst) {
          this.const[key] = this.evaluateExpression(key, sourceConst[key], evaluationContext);
        }
      }

      this.ctxVars = {};
      const sourceCtxVars = this.context.component.config.variables || {};
      if (sourceCtxVars) {
        if (typeof sourceCtxVars !== "object") return;
        for (const key in sourceCtxVars) {
          this.ctxVars[key] = this.evaluateExpression(key, sourceCtxVars[key], evaluationContext);
        }
      }
    };

    const pendingItems = this.collectPendingDefaultItems(evaluateDefaults);
    if (pendingItems.length === 0) return;

    let stop = null;
    stop = watch(
      () =>
        pendingItems.map((itemName) => this.statesStore.itemStates.get(itemName)?.state).join("|"),
      () => {
        const ready = pendingItems.every((itemName) => {
          const state = this.statesStore.itemStates.get(itemName);
          return state && state.state !== "-";
        });
        if (!ready) return;

        evaluateDefaults();
        void nextTick(() => {
          if (stop) stop();
        });
      },
      { immediate: true },
    );
  },
};
</script>
