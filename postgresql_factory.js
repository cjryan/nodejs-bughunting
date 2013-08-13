#!/bin/env node
var response = function(req, res) {
    var pg      = require('pg');
    var conString = "tcp://" + process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME + ":" + process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD + "@" + process.env.OPENSHIFT_POSTGRESQL_DB_HOST + ":" + process.env.OPENSHIFT_POSTGRESQL_DB_PORT + "/" + process.env.OPENSHIFT_APP_NAME;
    var client = new pg.Client(conString);
    client.connect();
    var query = client.query("CREATE TABLE factory(id INTEGER NOT NULL, data TEXT, PRIMARY KEY(id));");
    query.on('error', function(error) {
        client.query("ROLLBACK");
    });
    query.on('end', function() {
        client.query("COMMIT");
        var query = client.query("INSERT INTO factory VALUES(1, '1');");
        query.on('error', function(error) {
            client.query("ROLLBACK");
        });
        query.on('end', function() {
            if(req.query["version"]) {
                var query = client.query("UPDATE factory SET data='" + req.query["version"] + "' WHERE id=1;");
                query.on('end', function() {
                    client.end();
                });
                res.send("The postgresql factory is modified", {'Content-Type': 'text/plain'});
            }
            else {
                var query = client.query("SELECT * FROM factory;");
                query.on('row', function(row) {
                    res.send("version " + row["data"], {'Content-Type': 'text/plain'});
                });
                query.on('end', function() {
                    client.end();
                });
            }
        });
    });
};
module.exports.response = response;
