const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => { 
    res.send('Consumiendo web service de GN4 a ARC');    
    console.log(req.headers.host)
});

module.exports = router;