cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
        "id": "org.apache.cordova.inappbrowser.inappbrowser",
        "clobbers": [
            "window.open"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "dk.gi2.plugins.MeteorCordova": "0.0.6",
    "org.apache.cordova.inappbrowser": "0.5.0"
}
// BOTTOM OF METADATA
});