#!/bin/env node
var response = function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    var pg      = require('pg');
    var conString = "tcp://" + process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME + ":" + process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD + "@" + process.env.OPENSHIFT_POSTGRESQL_DB_HOST + ":" + process.env.OPENSHIFT_POSTGRESQL_DB_PORT + "/" + process.env.OPENSHIFT_APP_NAME;
    var client = new pg.Client(conString);
    client.connect(function(error) {
        if(error) {
            res.send("Failed to connect to PostgreSQL database\n" + error);
        }
    });
    var action = req.query["action"];
    if(action == "deploy") {
        var create_table = client.query("CREATE TABLE factory(id INTEGER NOT NULL, data TEXT, PRIMARY KEY(id));");
        create_table.on('error', function(error) {
            var rollback = client.query("ROLLBACK");
            rollback.on('error', function(error) {
                client.end();
                res.send("Failed to rollback the 'create table' transaction\n" + error);
            });
            rollback.on('end', function() {
                client.end();
                res.send("Failed to create table 'factory'\n" + error);
            });
        });
        create_table.on('end', function() {
            var insert_data = client.query("INSERT INTO factory VALUES(1, '1');");
            insert_data.on('error', function(error) {
                var rollback = client.query("ROLLBACK");
                rollback.on('error', function(error) {
                    client.end();
                    res.send("Failed to rollback the 'insert' transaction\n" + error);
                });
                rollback.on('end', function() {
                    client.end();
                    res.send("Failed to insert data into table 'factory'\n" + error);
                });
            });
            insert_data.on('end', function() {
                client.end();
                res.send("The postgresql factory is deployed\n");
            });
        });
    }
    else if(action == "modify") {
        if(req.query["version"]) {
            var modify = client.query("UPDATE factory SET data='" + req.query["version"] + "' WHERE id=1;");
            modify.on('error', function(error) {
                var rollback = client.query("ROLLBACK");
                rollback.on('error', function(error) {
                    client.end();
                    res.send("Failed to rollback the 'update' transaction\n" + error);
                });
                rollback.on('end', function() {
                    client.end();
                    res.send("Failed to modify the PostgreSQL factory'\n" + error);
                });
            });
            modify.on('end', function() {
                client.end();
                res.send("The postgresql factory is modified\n")
            });
        }
        else {
            client.end();
            res.send("Please specify the version while modifying\n")
        }
    }
    else {
        var query = client.query("SELECT * FROM factory WHERE id=1;");
        query.on('error', function(error) {
            var rollback = client.query("ROLLBACK");
            rollback.on('error', function(error) {
                client.end();
                res.send("Failed to rollback the 'select' transaction\n" + error);
            });
            rollback.on('end', function() {
                client.end();
                res.send("Failed to query the PostgreSQL database\n" + error);
            });
        });
        query.on('row', function(row) {
            res.send("version " + row["data"]);
        });
        query.on('end', function() {
            client.end();
        });
    }
};
module.exports.response = response;
