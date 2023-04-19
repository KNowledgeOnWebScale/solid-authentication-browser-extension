const solid = {
  getStatus(cb) {
    browser.runtime.sendMessage({
      msg: "check-authenticated",
    }, res => {
      delete res.latestIDP;
      // We stringify so that the page script can access the values in the object
      // after converting the string back to JSON.
      cb(JSON.stringify(res));
    });
  },
  onStatusChange(cb) {
    console.log('listener added');
    browser.runtime.onMessage.addListener(data => {
      if (data.msg === 'change-status') {
        delete data.msg;
        // We stringify so that the page script can access the values in the object
        // after converting the string back to JSON.
        cb(JSON.stringify(data));
      }
    });
  }
};

window.wrappedJSObject.solid = cloneInto(
  solid,
  window,
  {cloneFunctions: true});
