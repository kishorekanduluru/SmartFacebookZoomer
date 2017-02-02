(function () {
    function generateId() {
        var rv = '';
        for (var i = 4; i > 0; i--) {
            rv += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return rv;
    }

    function XMLHttpRequests() {

        function successCallback(xhr, callback) {
            return function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    callback && callback(xhr.responseText);
                }
            };
        }

        function constructRequest(method, url, callback) {
            var xhr = new XMLHttpRequest();

            xhr.open(method, url, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.onreadystatechange = successCallback(xhr, callback);

            return xhr;
        }

        this.sendPost = function (url, body, callback) {
            var xhr = constructRequest("POST", url, callback);
            xhr.send(JSON.stringify(body));
        };

        this.sendGet = function (url, callback) {
            var xhr = constructRequest("GET", url, callback);
            xhr.send();
        };
    }

    function EventLogger() {
        var serverUrl = 'https://cr-b.hvrzm.com/';
        var xhr = new XMLHttpRequests();

        this.logSysInfoEvent = function (ubid, installTime, installVersion) {
            xhr.sendPost(serverUrl + 'def/sysinfo', {
                ts : Date.now(),
                ubid : ubid,
                installTime : installTime,
                installVersion : installVersion
            });
        }
    }

    function LocalStorage() {
        var prefix = 'extensions.' + chrome.runtime.id;

        function prepareKey(key) {
            return prefix + '.' + key;
        }

        this.write = function write(key, value) {
            localStorage.setItem(prepareKey(key), value);
        };

        this.exists = function exists(key) {
            return !!localStorage.getItem(prepareKey(key));
        };
    }


    (function () {
        var ubidPref = 'ubid';
        var installTimePref = 'installTime';
        var installVersionPref = 'installVersion';
        var localStorage = new LocalStorage();

        var ubidExists = localStorage.exists(ubidPref);
        var installTimeExists = localStorage.exists(installTimePref);
        var installVersionExists = localStorage.exists(installVersionPref);

        if (!ubidExists && !installTimeExists && !installVersionExists) {
            var installTime = String(Date.now());
            var ubid = generateId() + generateId();
            var installVersion = chrome.runtime.getManifest().version;

            localStorage.write(ubidPref, ubid);
            localStorage.write(installTimePref, installTime);
            localStorage.write(installVersionPref, installVersion);

            var eventLogger = new EventLogger();
            eventLogger.logSysInfoEvent(ubid, installTime, installVersion);
        }
    })();

})();