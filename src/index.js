require('dotenv').config();
require('./database');
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

//settings
app.set('port', process.env.PORT || 3000);
app.set('json spaces', 2);
app.set('environment', process.argv[2] === 'sandbox' ? process.env.endpointSandbox : process.env.endpointProduction);
app.set('bearer', process.argv[2] === 'sandbox' ? process.env.bearerSandbox : process.env.bearerProduction);

//middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true}));

//force https
//const forceHttps = require('@crystallize/elasticloadbalancer-express-force-https');
//app.use(forceHttps());

//routes
app.use('/api/auth',require('./controllers/authController'));
app.use('/api/gn4-to-arc/cartoon', require('./routes/cartoon_generator'));
app.use('/api/gn4-to-arc/column', require('./routes/column_generator'));
app.use('/api/gn4-to-arc/article', require('./routes/article_generator'));
app.use('/api/gn4-to-arc/image', require('./routes/image_generator'));
app.use('/', require('./routes/root'));


//starting the server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
    console.log(`Environment ${app.get('environment')}`);
    console.log(`Bearer ${app.get('bearer')}`);    
});


