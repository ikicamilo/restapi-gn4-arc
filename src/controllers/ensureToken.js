const jwt = require('jsonwebtoken');

function ensureToken (req, res, next) {
    const bearerHeader = req.headers['x-access-token'];
    if (typeof bearerHeader !== 'undefined'){        
        req.token = bearerHeader;
        jwt.verify(req.token, process.env.my_secret_key, (err, data) => {
            if (err) {
                res.sendStatus(403);
            }else{
                next();           
            }
        })        
    }else{
        res.sendStatus(403);
    }
}

module.exports = ensureToken;
   