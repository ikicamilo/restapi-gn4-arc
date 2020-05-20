const { Router } = require('express');
const router = Router();
//const fs = require('fs');
const request = require('request-promise');
const arcfile = require('../templates/gn4-arc');
const verifyToken = require('../controllers/verifyToken');
const ensureToken = require('../controllers/ensureToken');


router.post('/', ensureToken, async (req, res) => { 
                   
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type, field_teaser} = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        /*Campos requeridos de ARC*/
        if (type == 'column'){
            arcfile.headlines.basic = title;      
            arcfile.content_elements[0].content = body.und[0].value; 
            arcfile.description.basic = field_teaser.und[0].value;                       
            arcfile.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile.source.source_id = field_gn4_id.und[0].value;
            arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;           
            arcfile.subtype = type;
            //tags
            if (field_tags){            
                const gn4Tags = field_tags.und[0].value.split(",");
                const arcTags = [];
                for (let i = 0; i < gn4Tags.length; i++) {
                    arcTags.push({
                        "type": "tag",
                        "text": gn4Tags[i]
                    });   
                }

                arcfile.taxonomy.tags = arcTags;
                arcfile.taxonomy.seo_keywords = gn4Tags;            
            }
            
            const arcRequest = {
                method: 'POST',
                uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story`,
                auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
                body: JSON.stringify(arcfile)
            };
            
            const resultRequest = await request(arcRequest);
            const jsonResultRequest = JSON.parse(resultRequest);                        
            res.send(jsonResultRequest._id);
        }else{
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
    
});

router.put('/:id', ensureToken, async (req, res) => { 
    // Peticion
    const arcRequestGetStory = {
        method: 'GET',
        uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story/${req.params.id}`,
        auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},        
        json: true,
        resolveWithFullResponse: true
    };

    
    let resultRequest = await request(arcRequestGetStory)     
        .catch(err => {
            return res.status(404).send('Column not found');
        });                
    
    if (resultRequest.body.subtype !== 'column'){
        return res.status(404).send('The id does not belong to a column');
    }
     
    const arc_revision_id = {      
        "parent_id": resultRequest.body.revision.revision_id    
    }
    
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type, field_teaser } = gn4file; 

    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        /*Campos requeridos de ARC*/
        if (type == 'column'){
            arcfile._id = req.params.id;
            arcfile.revision = arc_revision_id;
            arcfile.headlines.basic = title;      
            arcfile.content_elements[0].content = body.und[0].value;  
            arcfile.description.basic = field_teaser.und[0].value;                       
            arcfile.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile.source.source_id = field_gn4_id.und[0].value;
            arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;           
            arcfile.subtype = type;
            //tags
            if (field_tags){            
                const gn4Tags = field_tags.und[0].value.split(",");
                const arcTags = [];
                for (let i = 0; i < gn4Tags.length; i++) {
                    arcTags.push({
                        "type": "tag",
                        "text": gn4Tags[i]
                    });   
                }

                arcfile.taxonomy.tags = arcTags;
                arcfile.taxonomy.seo_keywords = gn4Tags;            
            }
            
            const arcRequest = {
                method: 'PUT',
                uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story/${req.params.id}`,
                auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
                body: JSON.stringify(arcfile)
            };
            
            resultRequest = await request(arcRequest);
            const jsonResultRequest = JSON.parse(resultRequest);                        
            res.send(jsonResultRequest._id);
        }else{
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});

module.exports = router;