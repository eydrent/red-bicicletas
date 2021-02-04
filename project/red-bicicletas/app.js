var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// Incluimos
const passport = require('./config/passport');
// Creamos el objeto session
const session = require('express-session');

var indexRouter = require('./routes/index');
// Agregamos usuarios
var usuariosRouter = require('./routes/usuarios');
// Agregamos token
var tokenRouter = require('./routes/token');
var usersRouter = require('./routes/users');
var bicicletasRouter = require('./routes/bicicletas');
var bicicletasAPIRouter = require('./routes/api/bicicletas');
var usuarioAPIRouter = require('./routes/api/usuarios');

// Definimos un objeto store para definir cual es motor de session que vamos a usar
// Utilizamos el MemoryStore sera bastante agil ya que quedara en la memoria del servidor
const store = session.MemoryStore;

var app = express();
// Lo que hacemos una vez definido el express es decirle a app que use session
app.use(session({
  cookie: { mazAge: 240 * 60 * 60 * 1000 },
  sote: store,
  saveUninitialized: true,
  resave: 'true',
  secret: 'red_bicis_!!!***!".!".!".!".123123'
}));

// Referenciamos a moongoose
var mongoose = require('mongoose');

var mongoDB = 'mongodb://localhost/red_bicicletas';
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Despues del cookieParser también inicializar passport y passport.session
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// Agremaos el app.use de usuarios
app.use('/usuarios', usuariosRouter);
// Agregamos el app.use de token
app.use('/token', tokenRouter);
app.use('/bicicletas', loggedIn, bicicletasRouter);

app.use('/users', usersRouter);

app.use('/api/auth', authApiRouter);
app.use('/api/bicicletas', validarUsuario, bicicletasApiRouter);
app.use('/api/usuarios', usuariosAPIRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//funcion para saber si es logged
function loggedIn(req, res, next) {
  if (req.user){
    next();
  }else{
    console.log('Usuario sin loguarse');
    res.redirect('/login');
  }
};

function validarUsuario (req, res, next) {
  jwt.verify(req.headers['x-access-token'], req.app.get('secretKey'), function(err, decoded){
    if(err) {
      res.json({ status: "error", message: err.message, data: null })
    } else {
      req.body._userId = decoded.id;
      console.log('jwt verify: ' + decoded);

      next();
    }
  })
}

module.exports = app;
