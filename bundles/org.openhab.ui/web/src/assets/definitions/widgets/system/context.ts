import { pt, pb, pi, pn } from '../helpers.ts'

export default () => [
  pt(
    'functions',
    'Widget Functions',
    'Object with key:arrow-function pairs. Functions are available to expressions in all child components via the <code>fn</code> object.<br />Functions are evaluated on every call and re-evaluated when dependency values change.'
  ),
  pt(
    'constants',
    'Widget Constants',
    'Object with key:constant pairs. Constants are available to expressions in all child components via the <code>const</code> object.<br />Constants cannot be changed by widget actions and are re-evaluated when dependency values change.'
  ),
  pt(
    'variables',
    'Widget Variables',
    'Object with key:variable default value pairs. Variables are available to expressions in all child components via the <code>vars</code> object and take precedence over variables with the same name from higher contexts.<br />Variable defaults are re-evaluated while they still have their previous default value, allowing late item state dependencies to initialize them. Once changed by a component variable action (e.g. <a class="external text-color-blue" target="_blank" href="https://www.openhab.org/docs/ui/components/oh-button.html#action-variable">oh-button</a>), their values are preserved.'
  )
]
