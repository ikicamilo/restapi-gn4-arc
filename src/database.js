const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/gn4db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(db => console.log('Database is connected'));