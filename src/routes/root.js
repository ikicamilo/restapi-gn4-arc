const { Router } = require('express');
const router = Router();

router.get('/', (req, res) => { 
    const environment = req.app.get('environment');    
    res.send(`Consumiendo web service de GN4 a ARC en ${environment}`);    
    console.log(req.headers.host)
});

module.exports = router;