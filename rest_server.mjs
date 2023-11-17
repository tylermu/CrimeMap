import * as path from 'node:path';
import * as url from 'node:url';

import { default as express } from 'express';
import { default as sqlite3 } from 'sqlite3';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

const port = 8000;

let app = express();
app.use(express.json());

/********************************************************************
 ***   DATABASE FUNCTIONS                                         ***
 ********************************************************************/
// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});

// Create Promise for SQLite3 database SELECT query
function dbSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function dbRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

/********************************************************************
 ***   REST REQUEST HANDLERS                                      ***
 ********************************************************************/
// GET request handler for crime codes
app.get('/codes', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let sql = 'SELECT code, incident_type AS type FROM Codes ORDER BY code';
    let params = [];
    console.log(sql);
    console.log(params);
    dbSelect(sql, params)
    .then((rows) => {
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let sql = 'SELECT neighborhood_number AS id, neighborhood_name AS name FROM Neighborhoods ORDER BY id';
    let params = [];
    dbSelect(sql, params)
    .then((rows) => {
        
        res.status(200).type('json').send(rows);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err);
    });
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let sql = 'SELECT * FROM Incidents ORDER BY date_time DESC LIMIT 1000';
    let params = [];
    dbSelect(sql, params)
    .then((rows) => {
        
        res.status(200).type('json').send(rows);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err);
    });
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for removing a crime incident
app.delete('/remove-incident', (req, res) => {
    const { case_number } = req.body; // Uploaded data containing case_number

    if (!case_number) {
        res.status(400).type('txt').send('Case number is missing.');
    }

    const checkIfExistsQuery = 'SELECT * FROM Incidents WHERE case_number = ?';
    dbSelect(checkIfExistsQuery, [case_number])
        .then((rows) => {
            if (rows.length === 0) {
                res.status(404).type('txt').send('Case number does not exist in the database.');
            }

            const deleteQuery = 'DELETE FROM Incidents WHERE case_number = ?';
            dbRun(deleteQuery, [case_number])
                .then(() => {
                    res.status(200).type('txt').send('Data removed successfully.');
                })
                .catch((error) => {
                    res.status(500).type('txt').send(error);
                });
        })
        .catch((error) => {
            res.status(500).type('txt').send(error);
        });
});


/********************************************************************
 ***   START SERVER                                               ***
 ********************************************************************/
// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
