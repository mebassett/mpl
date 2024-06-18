import assert from 'assert'
import MPL from '../src/mpl'
import dotenv from 'dotenv'
import wrtc from '@roamhq/wrtc'
import childProcess from 'child_process'

dotenv.config()

function createStore() {
  const mkNetwork = ds => new MPL.Network(ds, wrtc);
  let store = new MPL.Store((state, action) => {
    switch(action.type) {
      case "INCREMENT":
        return MPL.Automerge.change(state, "INCREMENT", (doc) => {
          doc.counter = (state.counter || 0) + 1
        })
      default:
        return state
    }
  }, mkNetwork)

  return store
}

describe("Store", function() {
  it("initializes", function() {
    assert.doesNotThrow(() => {
      let store = createStore()
    })
  })

  it.skip("has a UUID", function() {
    let store = createStore()
    assert(store.getState.docId, "no docID set: XXX @choxi what should we actually test here?")
  })

  it("accepts a reducer", function() {
    let store = createStore()
    store.dispatch({ type: "INCREMENT" })

    assert.equal(1, store.getState().counter)
  })

  it("allows you to overwrite default reducer actions", function() {
    let store = createStore()
    store.newDocument = (state, action) => {
      return MPL.Automerge.change(state, (doc) => {
        doc.foo = "bar"
      })
    }

    store.dispatch({ type: "NEW_DOCUMENT" })

    assert.equal("bar", store.getState().foo)
  })

  it("allows you to fork documents", function() {
    let store = createStore()
    let originalDocId = store.getState().docId

    store.dispatch({ type: "INCREMENT" })
    store.dispatch({ type: "FORK_DOCUMENT" })

    assert.equal(store.getState().counter, 1)
    assert.notEqual(store.getState().docId, originalDocId)
    assert.notEqual(store.getState().docId, undefined)
  })

})

describe("getHistory()", function() {
  it("returns the store's change history", function() {
    let store = createStore()
    assert.equal(store.getHistory().length, 1)
    assert.equal(store.getHistory()[0].change.message, "new document")

    store.dispatch({ type: "INCREMENT" })
    assert.deepEqual(store.getHistory().length, 2)
    assert.equal(store.getHistory()[1].change.message, "INCREMENT")
  })

  it("returns the action data for forkDocument", function() {
    let store = createStore()
    store.dispatch({ type: "FORK_DOCUMENT" })
    assert.deepEqual(store.getHistory()[1].change.message.action.type, "FORK_DOCUMENT")
  })
})

describe.skip("Network", function() {
  it("synchronizes between two clients", function(done) {
    this.timeout(30000)

    childProcess.execFile("node", ["test/bot.js"], (error, stdout, stderr) => {
      console.log("error: ", error)
      console.log("Stdout", stdout)
      console.log("stderr", stderr)
    })

    let store = createStore()

    MPL.config.name = "Test Store"
    store.dispatch({type: "OPEN_DOCUMENT", docId: "botcounter-abcd"})

    setTimeout(() => {
      let counter = store.getState().counter
      assert(counter && counter > 0)
      done()
    }, 5000)
  })
})
