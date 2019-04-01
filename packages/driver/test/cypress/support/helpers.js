/* eslint arrow-body-style: "off" */

const { _ } = Cypress
const debug = require('debug')('spec')

const getFirstSubjectByName = (name) => {
  return cy.queue.find({ name }).get('subject')
}

const getQueueNames = () => {
  return _.map(cy.queue, 'name')
}

const createHooks = (win, hooks = []) => {
  _.each(hooks, (hook) => {

    if (_.isString(hook)) {
      hook = { type: hook }
    }

    let { type, fail, fn } = hook

    if (fn) {
      return win[type](fn)
    }

    if (fail) {

      const numFailures = fail

      return win[type](() => {
        if (_.isNumber(fail) && fail-- === 0) {
          debug(`hook pass after (${numFailures}) failures: ${type}`)
          win.assert(true, type)

          return
        }

        debug(`hook fail: ${type}`)

        win.assert(false, type)

        throw new Error(`hook failed: ${type}`)

      })
    }

    return win[type](() => {
      win.assert(true, type)
      debug(`hook pass: ${type}`)
    })

  })
}

const createTests = (win, tests = []) => {
  _.each(tests, (test) => {
    if (_.isString(test)) {
      test = { name: test }
    }

    let { name, pending, fail, fn, only } = test

    let it = win.it

    if (only) {
      it = it['only']
    }

    if (fn) {

      if (test.eval) {
        const fnStr = fn.toString()

        fn = () => win.eval(`(${fnStr})()`)
      }

      return it(name, fn)

    }

    if (pending) {
      return it(name)
    }

    if (fail) {
      return it(name, () => {
        if (_.isNumber(fail) && fail-- === 0) {

          debug(`test pass after retry: ${name}`)
          win.assert(true, name)

          return
        }

        debug(`test fail: ${name}`)
        win.assert(false, name)

        throw new Error(`test fail: ${name}`)
      })
    }

    return it(name, () => {
      debug(`test pass: ${name}`)
      win.assert(true, name)
    })

  })
}

const createSuites = (win, suites = {}) => {
  _.each(suites, (obj, suiteName) => {
    win.describe(suiteName, () => {
      createHooks(win, obj.hooks)
      createTests(win, obj.tests)
      createSuites(win, obj.suites)
    })
  })
}

const generateMochaTestsForWin = (win, obj) => {
  createHooks(win, obj.hooks)
  createTests(win, obj.tests)
  createSuites(win, obj.suites)
}

// window.localStorage.debug = 'spec*'

module.exports = {
  getQueueNames,

  getFirstSubjectByName,

  generateMochaTestsForWin,
}
