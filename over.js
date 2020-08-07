/** An observable pattern that uses React's `setEvent()` handlers
 *  to inject the updated state back into the react elements.
 */

module.exports = class OverObservable {

  /** For the owner to send updates to the registered listeners.
   *  The passed lambda should provide data in the expected format.
   *  The lambda should not be async, as this code should be fast and not include
   *  business logic.
   *
   *  The filterFunc may be memoized (during a single update of
   *  all observers), so it isn't called as frequently for a large number of observers.
   *
   *  @param filterFunc A lambda that returns an object with the state variables to update. (return null to skip updating)
   */
  constructor(filterFunc) {
    this._observers = [];
    this._otherCallbacks = [];
    this._filterFunc = filterFunc;
    this._nextId = 111;
  }

  /** Add a new observing react component
   * @param setstateFunc The function in react `this.setState` which will be used to update the state.
   * @param variableName The name for the state variables that gets updated.
   * @param skipInitial set to `true` if you don't want the initial value to be returned.
   * @returns null
   */
  register(setstateFunc, variableName, skipInitial) {
    myId = this._nextId += 1;
    this._observers.push({setstateFunc, variableName, myId});
    if (skipInitial !== true) {
      let val = this._filterFunc();
      return [myId, val];
    }
    return [myId, null];
  }

  /** Add a new observer that's another over function.
   * @param callback The reference to another "over" instance that will also notify.
   */
  registerCallback(callback) {
    //TODO: new WeakRef(callback)); // hold it weakly (when react native supports this)
    this._otherCallbacks.push(callback);
  }

  /** For the owner to send updates to the registered listeners.
   *  This will use the filterFunc passed to the constructor.
   */
  notify() {
    for (const info1 of this._otherCallbacks) {
      try {
        let otherOver = info1; //info1.deref();
        if (otherOver != undefined) {
          otherOver(); // Notify any other overs, if they still exist.
        }
      } catch (e) {
        console.error(`While notifying of controller changes 1.`, e);
      }
    }
    let val = this._filterFunc();
    // Skip updating if the result is null
    if (val === null) {
      return;
    }
    for (const info of this._observers) {
      try {
        //if (info.setstateFunc == null) { continue; }
        if (val != null) {
          let s = {};
          s[info.variableName] = val;
          info.setstateFunc(s);
        }
      } catch (e) {
        console.error(`While notifying of controller changes 2.`, e);
      }
    }
  }

  /** Remove an observing react component.
   * @param setstateFunc The function in react `this.setState` which will be used to update the state.
   * @returns null
   */
  unregister(myId) {
    const idx = this._observers.findIndex(a => a.myId === myId);
    if (idx != -1) {
      this._observers.splice(idx, 1);
    }
  }

  /** Remove an observing over component.
   * @param callback the other Over class that's being unregistered.
   * @returns null
   */
  unregisterCallback(callback) {
    this._otherCallbacks.push(callback);
  }

};
