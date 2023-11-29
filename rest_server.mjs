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
    let sql = 'SELECT code, incident_type AS type FROM Codes';
    let params = [];
    let count = 0;
    if(req.query.hasOwnProperty('code')) {
        let query = req.query.code.toString();
        const MyArray = query.split(",");
        sql += ' WHERE code IN (';
        MyArray.forEach((item) => {
            console.log(item);
            if (!MyArray[count+1]){
                sql += "?" + ")";
                params.push(item);
            } else {
                sql += "?" + ",";
                params.push(item);
            }
            count++;
        });
        console.log(sql)
        console.log(params)
        sql += " ORDER BY code";
    } else {
        sql += " ORDER BY code";
    }
 
    dbSelect(sql, params)
    .then((rows) => {
        console.log(sql)
        console.log(params)
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});
 
// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let sql = 'SELECT neighborhood_number AS id, neighborhood_name AS name FROM Neighborhoods';
    let params = [];
    let count = 0;
    if(req.query.hasOwnProperty('id')) {
        let query = req.query.id.toString();
        const MyArray = query.split(",");
        sql += ' WHERE id IN (';
        MyArray.forEach((item) => {
            console.log(item);
            if (!MyArray[count+1]){
                sql += "?" + ")";
                params.push(item);
            } else {
                sql += "?" + ",";
                params.push(item);
            }
            count++;
        });
        console.log(sql)
        console.log(params)
        sql += " ORDER BY id";
    } else {
        sql += " ORDER BY id";
    }
 
    dbSelect(sql, params)
    .then((rows) => {
        console.log(sql)
        console.log(params)
        res.status(200).type('json').send(rows);
    })
    .catch((error) => {
        res.status(500).type('txt').send(error);
    })
});
 
// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let sql = 'SELECT case_number, DATE(date_time) as date, TIME(date_time) as time, code, incident, police_grid, neighborhood_number, block FROM Incidents';
    let params = [];
    let count = 0;
    if(req.query.hasOwnProperty('start_date')) { //start date filter
        let query = req.query.start_date.toString();
        sql += ' WHERE date > ';
        sql += "'" + query + "'";
        count++;
    }
    if (req.query.hasOwnProperty('end_date')) { //end date filter
        let query = req.query.end_date
        if (count == 0) {
            sql += ' WHERE date <= '
            sql += "'" + query + "'";
            count++;
        } else {
            sql += " AND date <= ";
            sql += "'" + query + "'";
            count++;
        }
    }
    if(req.query.hasOwnProperty('code')) { //code filter
        if (count == 0) {
            let count2 = 0;
            let query = req.query.code.toString();
            const MyArray = query.split(",");
            sql += ' WHERE code IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        } else {
            let count2 = 0;
            let query = req.query.code.toString();
            const MyArray = query.split(",");
            sql += ' AND code IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        }
    }
 
    if(req.query.hasOwnProperty('grid')) { //grid filter
        if (count == 0) {
            let count2 = 0;
            let query = req.query.grid.toString();
            const MyArray = query.split(",");
            sql += ' WHERE police_grid IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        } else {
            let count2 = 0;
            let query = req.query.grid.toString();
            const MyArray = query.split(",");
            sql += ' AND police_grid IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        }
    }
 
    if(req.query.hasOwnProperty('neighborhood')) { //neighborhood filter
        if (count == 0) {
            let count2 = 0;
            let query = req.query.neighborhood.toString();
            const MyArray = query.split(",");
            sql += ' WHERE neighborhood_number IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        } else {
            let count2 = 0;
            let query = req.query.neighborhood.toString();
            const MyArray = query.split(",");
            sql += ' AND neighborhood_number IN (';
            MyArray.forEach((item) => {
                console.log(item);
                if (!MyArray[count2+1]){
                    sql += "?" + ")";
                    params.push(item);
                } else {
                    sql += "?" + ",";
                    params.push(item);
                }
                count2++;
                count++;
        });
        }
    }
   
    if(req.query.hasOwnProperty('limit')) {
        let query = req.query.limit.toString();
        sql += " ORDER BY date_time DESC LIMIT " + query;
    } else {
        sql += " ORDER BY date_time DESC LIMIT 1000";
    }
    console.log(sql);
    console.log(params);
    dbSelect(sql, params)
    .then((rows) => {
        res.status(200).type('json').send(rows);
    })
    .catch((err) => {
        res.status(500).type('txt').send(err);
    });
});
//curl -X PUT "http://localhost:8000/new-incident" -H "Content-Type: application/json" -d "{\"case_number\": \"23200822\", \"date\": \"2023-11-01\", \"time\": \"04:58:00\", \"code\":\"9954\", \"incident\":\"Proactive Police Visit\", \"police_grid\": \"49\", \"neighborhood_number\": \"6\", \"block\": \"LAWSON AVE W AND KENT\"}"
 
// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    const { case_number, date, time, code, incident, police_grid, neighborhood_number, block } = req.body;
    const dateTime = `${date} ${time}`;
 
    const insertQuery = 'INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)';
    dbRun(insertQuery, [case_number, dateTime, code, incident, police_grid, neighborhood_number, block])
        .then(() => {
            res.status(200).type('txt').send('Incident data inserted successfully.');
        })
        .catch((error) => {
            if (error.message.includes('UNIQUE constraint failed')) {
                res.status(500).type('txt').send('Case number already exists in the database.');
            } else {
                res.status(500).type('txt').send(error);
            }
        });
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