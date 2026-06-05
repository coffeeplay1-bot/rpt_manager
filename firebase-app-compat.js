(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.firebase = factory());
})(this, function () { 
    'use strict';

    var FirebaseCore = (function () {
        function FirebaseCore() {
            this.apps_ = new Map();
        }
        FirebaseCore.prototype.initializeApp = function (options, name) {
            var appName = name || "DEFAULT";
            if (this.apps_.has(appName)) {
                return this.apps_.get(appName);
            }
            var container = {
                name: appName,
                options: options,
                firestore: function() {
                    if (window.firebase && typeof window.firebase.firestore === 'function') {
                        return window.firebase.firestore();
                    }
                    return null;
                }
            };
            this.apps_.set(appName, container);
            return container;
        };
        FirebaseCore.prototype.app = function (name) {
            var appName = name || "DEFAULT";
            return this.apps_.get(appName);
        };
        return FirebaseCore;
    }());

    var firebaseInstance = new FirebaseCore();
    if (typeof window !== 'undefined') {
        window.firebase = firebaseInstance;
    }
    return firebaseInstance;
});
