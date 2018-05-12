// ==UserScript==
// @name         Auto Close Crunchyroll Ads
// @version      1.1.20
// @description  Close Crunchyroll ads automatically!
// @author       fuzetsu (change by Arias800)
// @match        http://static.ak.crunchyroll*
// @match        https://static.ak.crunchyroll*
// @match        http://*.crunchyroll.com/*
// @match        https://*.crunchyroll.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @require      https://cdn.rawgit.com/fuzetsu/userscripts/7e2dbd8d041afa4bda5914b4c8086b2519c51b41/wait-for-elements/wait-for-elements.js
// ==/UserScript==

var Util = {
  log: function () {
    var args = [].slice.call(arguments);
    args.unshift('%c' + SCRIPT_NAME + ':', 'font-weight: bold;color: purple;');
    console.log.apply(console, args);
  },
  clearTicks: function(ticks) {
    ticks.forEach(function(tick) {
      if(typeof tick === 'number') {
        clearInterval(tick);
      } else {
        tick.stop();
      }
    });
    ticks.length = 0;
  },
  keepTrying: function(wait, action) {
    var tick = setInterval(function() {
      if(action()) {
        clearInterval(tick);
      }
    }, wait);
  },
  storeGet: function(key) {
    if (typeof GM_getValue === "undefined") {
      var value = localStorage.getItem(key);
      if (value === "true" || value === "false") {
        return (value === "true") ? true : false;
      }
      return value;
    }
    return GM_getValue(key);
  },
  storeSet: function(key, value) {
    if (typeof GM_setValue === "undefined") {
      return localStorage.setItem(key, value);
    }
    return GM_setValue(key, value);
  },
  storeDel: function(key) {
    if (typeof GM_deleteValue === "undefined") {
      return localStorage.removeItem(key);
    }
    return GM_deleteValue(key);
  },
  q: function(query, context) {
    return (context || document).querySelector(query);
  },
  qq: function(query, context) {
    return [].slice.call((context || document).querySelectorAll(query));
  },
};

var SCRIPT_NAME = 'Auto Close Crunchyroll Ads';
var SEC_WAIT = parseInt(Util.storeGet('SEC_WAIT'));
var ticks = [];
var videoUrl;

if(!SEC_WAIT && SEC_WAIT !== 0) SEC_WAIT = 3;

function waitForAds() {
  ticks.push(
    waitAndClick('#an_skip_button', function(btn) {
      Util.keepTrying(1000, function() {
        btn.click();
        if(!Util.q('#an_skip_button')) {
          return true;
        }
      });
    }),
    waitAndClick('._18ah _1t7w')
  );
 }

function waitAndClick(sel, cb, extraWait) {
  return waitForElems(sel, function(btn) {
    Util.log('Found ad, closing in', SEC_WAIT, 'seconds');
    setTimeout(function() {
      btn.click();
      if(cb) {
        cb(btn);
      }
    }, SEC_WAIT * 1000 + (extraWait || 0));
  });
}

Util.log('Started');

if(window.self === window.top) {
  waitForUrl(/^http:\/\/www.crunchyroll.com\/.+\/.+/, function() {
    if(videoUrl && location.href !== videoUrl) {
      Util.log('Changed video, removing old wait');
      Util.clearTicks(ticks);
    }
    videoUrl = location.href;
    Util.log('Entered video, waiting for ads');
    waitForAds();
    ticks.push(
      waitForUrl(function(url) {
        return url !== videoUrl;
      }, function() {
        videoUrl = null;
        Util.clearTicks(ticks);
        Util.log('Left video, stopped waiting for ads');
      }, true)
    );
  });
}

// register menu commands
GM_registerMenuCommand(SCRIPT_NAME + ': set ad close delay', function() {
  var wait = parseInt(prompt('Current setting is ' + SEC_WAIT + ' seconds. Enter the number of seconds you would like the script to wait before closing an ad. 0 means no delay.'));
  if(!isNaN(wait)) {
    SEC_WAIT = wait;
    Util.storeSet('SEC_WAIT', SEC_WAIT);
  }
});
