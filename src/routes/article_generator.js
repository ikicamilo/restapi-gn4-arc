const { Router } = require('express');
const router = Router();
const fs = require('fs');
const request = require('request-promise');
const arcfile = require('../templates/gn4-arc');
const arcfile2 = require('../templates/gn4-arc');
const verifyToken = require('../controllers/verifyToken');
const ensureToken = require('../controllers/ensureToken');
let gn4Images = []

router.post('/', ensureToken, async (req, res) => { 
                   
    const gn4file = req.body;
    const { title, body, field_gn4_id, field_fecha_publi_text, type, field_tags, field_main_image, field_imagenes_fid, field_teaser } = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type && field_main_image){
        if (type == 'article'){                
            /* Campos */
            arcfile.headlines.basic = title;      
            arcfile.content_elements[0].content = body.und[0].value;
            arcfile.first_publish_date = field_fecha_publi_text.und[0].value;
            arcfile.description.basic = field_teaser.und[0].value;
            //arcfile.credits.by[0].referent.id = field_usuario_gn4_id.und[0].value;
            arcfile.source.source_id = field_gn4_id.und[0].value;
            arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;
            arcfile.subtype = type;
            arcfile.additional_properties.type_content = "article";
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
            //main image
            if (field_main_image){
                arcfile.content_elements.push({
                    "_id": field_main_image.und[0].fid,
                    "type": "reference",
                    "referent": {
                        "id": field_main_image.und[0].fid,
                        "type": "image"
                    }
                });
                
                arcfile.promo_items={                    
                    "basic": {
                        "type": "reference",
                        "_id": field_main_image.und[0].fid,
                        "referent": {
                            "id": field_main_image.und[0].fid,
                            "provider": "",
                            "type": "image"
                        }
                    }                    
                };                
            }

            if (field_imagenes_fid){
                const gn4Images = field_imagenes_fid.und[0].value.split(",");                
                for (let i = 0; i < gn4Images.length; i++) {
                    arcfile.content_elements.push({
                        "_id": gn4Images[i],
                        "type": "reference",
                        "referent": {
                            "id": gn4Images[i],
                            "type": "image"
                        }
                    });
                }
                console.log(arcfile.content_elements)
            }
            
            // Peticion
            const arcRequest = {
                method: 'POST',
                uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story`,
                auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
                body: JSON.stringify(arcfile)
            };
            
            const resultRequest = await request(arcRequest);
            const jsonResultRequest = JSON.parse(resultRequest);                        
            res.send(jsonResultRequest._id);
            arcfile.content_elements= [{
                "type": "text",
                "content": ""
            }];            
        }else{
            return res.status(404).send('This content is not an article');
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
            return res.status(404).send('Article not found');
        });                

   
    if (resultRequest.body.subtype !== 'article'){
        return res.status(404).send('The id does not belong to an article');
    }

    const arc_revision_id = {      
        "parent_id": resultRequest.body.revision.revision_id    
    }
    
    const gn4file = req.body;
    const { title, body, field_gn4_id, field_fecha_publi_text, type, field_tags, field_main_image, field_imagenes_fid, field_teaser } = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type && field_main_image){
        if (type == 'article'){                
            /* Campos */
            arcfile._id = req.params.id;
            arcfile.revision = arc_revision_id;
            arcfile.headlines.basic = title;  
            arcfile.description.basic = field_teaser.und[0].value;    
            arcfile.content_elements[0].content = body.und[0].value;
            arcfile.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile.source.source_id = field_gn4_id.und[0].value;
            arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;
            arcfile.subtype = type;
            arcfile.additional_properties.type_content = "article";
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
            //main image
            if (field_main_image){
                arcfile.content_elements.push({
                    "_id": field_main_image.und[0].fid,
                    "type": "reference",
                    "referent": {
                        "id": field_main_image.und[0].fid,
                        "type": "image"
                    }
                });
                
                arcfile.promo_items={                    
                    "basic": {
                        "type": "reference",
                        "_id": field_main_image.und[0].fid,
                        "referent": {
                            "id": field_main_image.und[0].fid,
                            "provider": "",
                            "type": "image"
                        }
                    }                    
                };                
            }

            if (field_imagenes_fid){
                gn4Images = field_imagenes_fid.und[0].value.split(",");
                for (let i = 0; i < gn4Images.length; i++) {
                    arcfile.content_elements.push({
                        "_id": gn4Images[i],
                        "type": "reference",
                        "referent": {
                            "id": gn4Images[i],
                            "type": "image"
                        }
                    });
                }
            }
            
            // Peticion
            const arcRequest = {
                method: 'PUT',
                uri: `https://api.sandbox.elespectador.arcpublishing.com/story/v2/story/${req.params.id}`,
                auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
                body: JSON.stringify(arcfile)
            };
            
            resultRequest = await request(arcRequest);
            const jsonResultRequest = JSON.parse(resultRequest);                        
            res.send(jsonResultRequest._id);

            arcfile.content_elements= [{
                "type": "text",
                "content": ""
            }];
        }else{
            return res.status(404).send('This content is not an article');
        }
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});


module.exports = router;