<template>
  <generic-widget-component
    v-for="(slotComponent, idx) in defaultSlots"
    v-bind="$attrs"
    :key="'default-' + idx"
    :context="childrenContext(slotComponent)" />
</template>

<script>
import { f7 } from 'framework7-vue'

import { computed, reactive, watchEffect } from 'vue'
import { useWidgetContext } from '@/components/widgets/useWidgetContext'
import { OhContextDefinition } from '@/assets/definitions/widgets/system'

export default {
  inheritAttrs: false,
  props: {
    context: Object
  },
  widget: OhContextDefinition,
  setup(props) {
    const { varScope, childContext, evaluateExpression, defaultSlots } = useWidgetContext(computed(() => props.context))
    varScope.value = (props.context.varScope || 'varScope') + '-' + f7.utils.id()

    const constants = reactive({})
    const localCtxVars = reactive({})
    const variableDefaults = new Map()

    const valueFingerprint = (value) => {
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    }

    watchEffect(() => {
      if (!props.context?.component?.config) return

      const sourceConst = props.context.component.config.constants || {}
      if (!sourceConst || typeof sourceConst !== 'object') return

      for (const key of Object.keys(constants)) {
        if (!Object.prototype.hasOwnProperty.call(sourceConst, key)) delete constants[key]
      }
      for (const key in sourceConst) {
        constants[key] = evaluateExpression(key, sourceConst[key])
      }
    })

    watchEffect(() => {
      if (!props.context?.component?.config) return

      const sourceCtxVars = props.context.component.config.variables || {}
      if (!sourceCtxVars || typeof sourceCtxVars !== 'object') return

      for (const key of Object.keys(localCtxVars)) {
        const previousDefault = variableDefaults.get(key)
        if (
          !Object.prototype.hasOwnProperty.call(sourceCtxVars, key) &&
          previousDefault &&
          valueFingerprint(localCtxVars[key]) === previousDefault.fingerprint
        ) {
          delete localCtxVars[key]
          variableDefaults.delete(key)
        }
      }
      for (const key in sourceCtxVars) {
        const evaluatedDefault = evaluateExpression(key, sourceCtxVars[key])
        const evaluatedDefaultFingerprint = valueFingerprint(evaluatedDefault)
        const previousDefault = variableDefaults.get(key)
        const variableExists = Object.prototype.hasOwnProperty.call(localCtxVars, key)
        const variableStillHasDefault = previousDefault && valueFingerprint(localCtxVars[key]) === previousDefault.fingerprint

        if (!variableExists || variableStillHasDefault) {
          if (!previousDefault || previousDefault.fingerprint !== evaluatedDefaultFingerprint) {
            localCtxVars[key] = evaluatedDefault
          }
        }
        variableDefaults.set(key, { fingerprint: evaluatedDefaultFingerprint })
      }
    })

    return { varScope, childContext, evaluateExpression, defaultSlots, constants, localCtxVars }
  },
  computed: {
    fn() {
      if (!this.context?.component?.config) return {}
      let evalFunc = {}
      const sourceFunc = this.context.component.config.functions || {}
      console.debug('oh-context: sourceFunc =', sourceFunc)
      if (sourceFunc) {
        if (typeof sourceFunc !== 'object') return {}
        for (const key in sourceFunc) {
          evalFunc[key] = this.evaluateExpression(key, sourceFunc[key])
        }
      }
      console.debug('oh-context: evalFunc =', evalFunc)
      return evalFunc
    }
  },
  methods: {
    childrenContext(childComp) {
      const ctx = this.childContext(childComp)
      const ctxFunctions = this.fn
      if (this.context.fn) {
        for (const funcKey in this.context.fn) {
          if (!ctxFunctions[funcKey]) ctxFunctions[funcKey] = this.context.fn[funcKey]
        }
      }
      ctx.fn = ctxFunctions

      ctx.const = {
        ...(this.context.const || {}),
        ...this.constants
      }

      if (typeof ctx.ctxVars !== 'object') ctx.ctxVars = {}
      ctx.ctxVars[this.varScope] = this.localCtxVars

      return ctx
    }
  }
}
</script>
