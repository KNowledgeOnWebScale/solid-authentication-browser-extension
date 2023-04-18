// content-script.js

const solid = {
  getStatus(cb) {
    browser.runtime.sendMessage({
      msg: "check-authenticated",
    }, res => {
      // We stringify so that the page script can access the values in the object
      // after converting the string back to JSON.
      cb(JSON.stringify(res));
    });
  }
};

window.wrappedJSObject.solid = cloneInto(
  solid,
  window,
  {cloneFunctions: true});
