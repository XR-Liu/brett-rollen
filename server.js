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

// Sessions initialisieren
const session = require('express-session');
app.use(session({ 
	secret: 'example',
	resave: false,
	saveUninitialized: true
}));

// Sessionvariable setzen
app.get('/sessionSetzen', function(req, res){
	req.session['sessionValue'] = Math.floor(Math.random()*100);
	res.redirect('/index');
});

// Sessionvariable löschen
app.get('/sessionLoeschen', function(req, res){
	delete req.session['sessionValue'];
	res.redirect('/index');
});

// Sessionvariable anzeigen
app.get('/index', function(req, res){
	if (!req.session['sessionValue']){
		res.render('index', {message: "Sessionvariable nicht gesetzt"});
	}
	else{
		res.render('index', {message: `Wert der Sessionvariable:
				${req.session['sessionValue']}`});
	}
});

app.get('/', (request, response) => {
    let authenticated = request.session.authenticated;
    let username = request.session.username;

    let greeting;
    if (!authenticated) {
        greeting = "Willkommen zu deinem individuellem Skateboard!";
    }
    else {
        greeting = `Willkommen, ${username}! Los gehts!`;
    }

    response.render('index', {
        isLoggedIn: authenticated,
        greeting: greeting
    });
});

//LOGIN
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

//REGISTRIERUNG
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

app.get('/impressum', (request, response) => {
    response.render('impressum')
});

//START
app.get('/start', (request, response) => {
    response.render('start')
});
app.post('/start', function(request, response){
    response.send('brett')
});
app.post('/start', function(request, response){
    response.send('impressum')
});

//BRETT
app.get('/brett', (request, response) => {
    response.render('brett')
});
app.post('/brett', function(request, response){
    response.send('achsen')
});
app.post('/brett', function(request, response){
    response.send('start')
});

//ACHSEN
app.get('/achsen', (request, response) => {
    response.render('achsen')
});
app.post('/achsen', function(request, response){
    response.send('rollen')
});
app.post('/achsen', function(request, response){
    response.send('brett')
});

//ROLLEN
app.get('/rollen', (request, response) => {
    response.render('rollen')
});
app.post('/rollen', function(request, response){
    response.send('endprodukt')
});
app.post('/rollen', function(request, response){
    response.send('achsen')
});

//ENDPRODUKT
app.get('/endprodukt', (request, response) => {
    response.render('endprodukt')
});
app.post('/endprodukt', function(request, response){
    response.send('rollen')
});
app.post('/endprodukt', function(request, response){
    response.send('register')
});
app.post('/endprodukt', function(request, response){
    response.send('login')
});

//BESTELLUNG
app.get('/bestellung', (request, response) => {
    response.render('bestellung')
});
app.post('/bestellung', function(request, response){
    response.send('gekauft')
});

//GEKAUFT
app.get('/gekauft', (request, response) => {
    response.render('gekauft')
});

app.use( express.static( "public" ));