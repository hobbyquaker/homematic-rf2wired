var rpc = require('binrpc');

/*
    Hier Konfiguration der IP-Adressen vornehmen

    rpcListenIp = IP-Adresse des Hosts auf dem homematic-rf2wired läuft.
    ccuIP = IP-Adresse der Homematic CCU
 */
var config = {
    "rpcListenIp": "172.16.23.134",
    "ccuIp": "172.16.23.3",
    "rpcListenPort": 2020
};

/*
 Hier werden RF-Tasten Wired-Tasten zugeordnet.

 Die Wired-Taste muss mit dem Profil "Dimmer - ein/heller" bzw "Dimmer - aus/dunkler" mit einem Dimmer direktverknüpft sein.
 Das Profil "Dimmer - ein/aus & heller/dunkler" kann NICHT genutzt werden!
*/
var mapping = {
    "JEQ0143490:1": "BidCoS-Wir:30",
    "JEQ0143490:2": "BidCoS-Wir:31"
};

var rpcClientWired = rpc.createClient({
    host: config.ccuIp,
    port: 2000,
    path: '/'
});

var rpcClientRf = rpc.createClient({
    host: config.ccuIp,
    port: 2001,
    path: '/'
});


var rpcServer = rpc.createServer({ host: config.rpcListenIp, port: config.rpcListenPort });

rpcServer.on('event', function (err, params, callback) {

    var channel = params[1];
    var datapoint = params[2];
    if (mapping[channel] && datapoint.match(/PRESS_*/)) {
        console.log(ts(), '<- event', channel, datapoint);
        var adr = mapping[channel];
        var params;
        switch (datapoint) {
            case 'PRESS_SHORT':
                params = [mapping[channel], 'PRESS_SHORT', true];
                rpcClientWired.methodCall('setValue', params, function (err, res) {
                    console.log(ts(), '-> setValue', params, err, JSON.stringify(res));
                });
                break;
            case 'PRESS_LONG':
            case 'PRESS_CONT':
                params = [mapping[channel], 'PRESS_LONG', true];
                rpcClientWired.methodCall('setValue', params, function (err, res) {
                    console.log(ts(), '-> setValue', params, err, JSON.stringify(res));
                });
                break;
            default:
                break;
        }

    }
    callback("");
});

var url = 'xmlrpc_bin://' + config.rpcListenIp + ':' + config.rpcListenPort;

rpcClientRf.on('connect', function () {
    rpcClientRf.methodCall('init', [url, 'rf2wired'], function (err, res) {
        console.log('      -> init', url, err, JSON.stringify(res));
    });
});

function ts() {
    return (((new Date()).getTime().toString().slice(-4)) / 1000).toFixed(3);
}

