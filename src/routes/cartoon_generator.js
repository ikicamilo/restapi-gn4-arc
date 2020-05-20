const { Router } = require('express');
const router = Router();
//const fs = require('fs');
const request = require('request-promise');
const arcfile = require('../templates/gn4-arc');
const verifyToken = require('../controllers/verifyToken');


router.post('/', verifyToken, async (req, res) => { 
                   
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type } = gn4file; 
    
    /*Campos requeridos de ARC*/
    arcfile.headlines.basic = title;      
    arcfile.content_elements.splice(0,0);
    
    arcfile.first_publish_date = field_fecha_publi_text.und[0].value;
    //arcfile.credits.by[0].referent.id = field_usuario_gn4_id.und[0].value;
    arcfile.source.source_id = field_gn4_id.und[0].value;
    arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;
   // arcfile.taxonomy.tags = field_tags.und[0].value;
    arcfile.subtype = type;
    
    const arcRequest = {
        method: 'POST',
        uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story`,
        auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
        body: JSON.stringify(arcfile)
    };
    
    const resultRequest = await request(arcRequest);

    res.send("Cartoon send to ARC");         
});

module.exports = router;