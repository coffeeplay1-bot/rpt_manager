(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory());
})(this, function () { 
    'use strict';

    var MockFirestore = (function () {
        function MockFirestore() {}
        
        MockFirestore.prototype.collection = function (collectionName) {
            return {
                doc: function (docId) {
                    return {
                        get: function () {
                            var dbData = JSON.parse(localStorage.getItem('cloud_mock_db')) || {};
                            var collectionData = dbData[collectionName] || {};
                            var docData = collectionData[docId] || null;
                            return Promise.resolve({
                                exists: !!docData,
                                data: function () { return docData; }
                            });
                        },
                        set: function (data, options) {
                            var dbData = JSON.parse(localStorage.getItem('cloud_mock_db')) || {};
                            if (!dbData[collectionName]) dbData[collectionName] = {};
                            
                            if (options && options.merge && dbData[collectionName][docId]) {
                                Object.assign(dbData[collectionName][docId], data);
                            } else {
                                dbData[collectionName][docId] = data;
                            }
                            
                            localStorage.setItem('cloud_mock_db', JSON.stringify(dbData));
                            return Promise.resolve();
                        },
                        update: function (data) {
                            var dbData = JSON.parse(localStorage.getItem('cloud_mock_db')) || {};
                            if (!dbData[collectionName]) dbData[collectionName] = {};
                            var currentData = dbData[collectionName][docId] || {};
                            Object.assign(currentData, data);
                            dbData[collectionName][docId] = currentData;
                            localStorage.setItem('cloud_mock_db', JSON.stringify(dbData));
                            return Promise.resolve();
                        }
                    };
                }
            };
        };
        return MockFirestore;
    }());

    if (typeof window !== 'undefined' && window.firebase) {
        window.firebase.firestore = function () {
            return new MockFirestore();
        };
        window.firebase.INTERNAL = {};
    }
});
