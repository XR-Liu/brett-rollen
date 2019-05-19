const express = require('express');
const app = express();

app.engine(".ejs", require("ejs").__express);
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const sqlite3 = require('sqlite3').verbose();
let database = new sqlite3.Database('users.db');

const bcrypt = require('bcrypt');
const saltRounds = 8;

app.listen(3000, function(){
    console.log('Server is listening to 3000');
});

app.get('/login', (request, response) => {
    if (!request.session.authenticated) {
        response.render('login', {
            error: false
        });
    }
    else {
        response.redirect('/');
    }
});

app.post('/login', (request, response) => {
    let name = request.body.name;
    let password = request.body.password;

    database.get(`SELECT * FROM user WHERE name='${name}'`, function(error, row) {
        if (error) {
            console.log(error);
            response.redirect('/login');
            return;
        }

        if (row != null) {
            bcrypt.compare(password, row.password, (error, result) => {
                if (error) {
                    console.log(error);
                    response.redirect('/login');
                    return;
                }

                if (result == true) {
                    request.session.authenticated = true;
                    request.session.name = row.name;
                    response.redirect('/');
                }
                else {
                    response.render('login', {
                        error: true
                    });
                }
            });
        } 
        else {
            response.render('login', {
                error: true
            });
        }
    });
});

app.get('/register', (request, response) => {
    if (!request.session.authenticated) {
        response.render('register', {
            error: null
        });
    }
    else {
        response.redirect('/');
    }
});

app.post('/register', (request, response) => {
    let name = request.body.name;
    let password = request.body.password;
    let passwordConfirm = request.body.passwordConfirm;

    if (password != passwordConfirm) {
        response.render('register', {
            error: "Die Passwörter stimmen nicht überein."
        });
        return;
    }

    database.get(`SELECT * FROM user WHERE name='${name}'`, function(error, row) {
        if (error) {
            console.log(error);
            response.redirect('/register');
            return;
        }

        if (row == null) {
            bcrypt.hash(password, saltRounds, (error, hash) => {
                if (error) {
                    console.log(error);
                    response.redirect('/register');
                    return;
                }

                database.run(`INSERT INTO user (name, password) VALUES ('${name}', '${hash}')`, (error) => {
                    if (error) {
                        console.log(error);
                        response.redirect('/register');
                        return;
                    }
                });
                console.log(`User '${name} registered`);
                request.session.authenticated = true;
                request.session.name = name;
                response.redirect('/');
            });
        }
        else {
            response.render('register', {
                error: "Dieser Benutzername ist bereits vorhanden."
            });
        }
    });
});