const { Router } = require('express');
const router = Router();
const fs = require('fs');
const request = require('request-promise');
const sectionsFile = require('../templates/sections');
const verifyToken = require('../controllers/verifyToken');
const ensureToken = require('../controllers/ensureToken');
let gn4Images = []

router.post('/', ensureToken, async (req, res) => {          
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    let arcfile = require('../templates/gn4-arc');
    const gn4file = req.body;
    const { title, body, field_gn4_id, field_fecha_publi_text, type, field_tags, field_main_image, field_imagenes_fid, field_teaser, field_section_text } = gn4file; 
        
    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        
        if (type == 'article'){                
            /* Campos */
            arcfile.headlines.basic = title;
            arcfile.headlines.meta_title = title;    
            arcfile.content_elements[0].content = body.und[0].value;
            arcfile.first_publish_date = field_fecha_publi_text.und[0].value;            
            //arcfile.credits.by[0].referent.id = field_usuario_gn4_id.und[0].value;
            arcfile.source.source_id = field_gn4_id.und[0].value;
            arcfile.additional_properties.publish_date = field_fecha_publi_text.und[0].value;
            arcfile.subtype = type;
            arcfile.additional_properties.type_content = "article";
            //teaser            
            if(field_teaser.und[0].value != null){           
                arcfile.description.basic = field_teaser.und[0].value;
            }else{                
                arcfile.description.basic = '';
            }  
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
            
            if (field_section_text){
                const drupalSectionStructure = field_section_text.und[0].value.split(";;");
                const sectionDrupal = drupalSectionStructure[1];
                for (let i = 0; i < sectionsFile.sections.length; i++) {                    
                    if(sectionsFile.sections[i].gn4Section == sectionDrupal){                        
                        arcfile.taxonomy.sites[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile.taxonomy.sections[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile.taxonomy.primary_section.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile.taxonomy.primary_site.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile.websites = {
                            "el-espectador": {
                                "website_section": {
                                    "type": "reference",
                                    "referent": {
                                        "id": sectionsFile.sections[i].arcSection,
                                        "type": "section",
                                        "website": "el-espectador"
                                    }
                                }
                            }
                        }
                        break;                       
                    }else{
                        arcfile.taxonomy.sites[0].referent.id = "";
                        arcfile.taxonomy.sections[0].referent.id = "";
                        arcfile.taxonomy.primary_section.referent.id = "";
                        arcfile.taxonomy.primary_site.referent.id = ""; 
                        arcfile.websites = {
                            "el-espectador":{}
                        }
                    }
                }                
            }else{
                arcfile.taxonomy.sites[0].referent.id = "";
                arcfile.taxonomy.sections[0].referent.id = "";
                arcfile.taxonomy.primary_section.referent.id = "";
                arcfile.taxonomy.primary_site.referent.id = ""; 
                arcfile.websites = {
                    "el-espectador":{}
                }
            }
            
            // Peticion           
            const arcRequest = {
                method: 'POST',
                uri: `${environment}/story/v2/story`,
                auth: {bearer: `${bearer}`},
                body: JSON.stringify(arcfile)
            };
                        
            const resultRequest = await request(arcRequest);
            const jsonResultRequest = JSON.parse(resultRequest);                        
            res.send(jsonResultRequest._id);
            delete arcfile;
            arcfile.content_elements= [{
                "type": "text",
                "content": ""
            }];                            
            arcfile.promo_items={};
            arcfile.taxonomy.tags = [];
            arcfile.taxonomy.seo_keywords = [];
                                                              
        }else{
            return res.status(404).send('This content is not an article');
        }
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});

router.put('/:id', ensureToken, async (req, res) => {
    let arcfile2 = require('../templates/gn4-arc-2');
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    // Peticion
    const arcRequestGetStory = {
        method: 'GET',
        uri: `${environment}/story/v2/story/${req.params.id}`,
        auth: {bearer: `${bearer}`},
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
    const { title, body, field_gn4_id, field_fecha_publi_text, type, field_tags, field_main_image, field_imagenes_fid, field_teaser, field_section_text } = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        if (type == 'article'){                
            /* Campos */
            arcfile2._id = req.params.id;
            arcfile2.revision = arc_revision_id;
            arcfile2.headlines.basic = title;
            arcfile2.headlines.meta_title = title;                  
            arcfile2.content_elements[0].content = body.und[0].value;
            arcfile2.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile2.source.source_id = field_gn4_id.und[0].value;
            arcfile2.additional_properties.publish_date = field_fecha_publi_text.und[0].value;
            arcfile2.subtype = type;
            arcfile2.additional_properties.type_content = "article";
            //teaser
            //teaser            
            if(field_teaser.und[0].value != null){           
                arcfile2.description.basic = field_teaser.und[0].value;
            }else{                
                arcfile2.description.basic = '';
            }             
            //tags
            if (field_tags){   
                arcfile2.taxonomy.tags = [];
                arcfile2.taxonomy.seo_keywords = [];         
                const gn4Tags = field_tags.und[0].value.split(",");
                const arcTags = [];
                for (let i = 0; i < gn4Tags.length; i++) {
                    arcTags.push({
                        "type": "tag",
                        "text": gn4Tags[i]
                    });   
                }

                arcfile2.taxonomy.tags = arcTags;
                arcfile2.taxonomy.seo_keywords = gn4Tags;            
            }
            //main image
            if (field_main_image){
                arcfile2.content_elements.push({
                    "_id": field_main_image.und[0].fid,
                    "type": "reference",
                    "referent": {
                        "id": field_main_image.und[0].fid,
                        "type": "image"
                    }
                });
                
                arcfile2.promo_items={                    
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
                    arcfile2.content_elements.push({
                        "_id": gn4Images[i],
                        "type": "reference",
                        "referent": {
                            "id": gn4Images[i],
                            "type": "image"
                        }
                    });
                }
            }

            if (field_section_text){                
                const drupalSectionStructure = field_section_text.und[0].value.split(";;");                
                const sectionDrupal = drupalSectionStructure[1];
                for (let i = 0; i < sectionsFile.sections.length; i++) {                    
                    if(sectionsFile.sections[i].gn4Section == sectionDrupal){
                        arcfile2.taxonomy.sites[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile2.taxonomy.sections[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile2.taxonomy.primary_section.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile2.taxonomy.primary_site.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile2.websites = {
                            "el-espectador": {
                                "website_section": {
                                    "type": "reference",
                                    "referent": {
                                        "id": sectionsFile.sections[i].arcSection,
                                        "type": "section",
                                        "website": "el-espectador"
                                    }
                                }
                            }
                        } 
                        break;                      
                    }else{
                        arcfile2.taxonomy.sites[0].referent.id = "";
                        arcfile2.taxonomy.sections[0].referent.id = "";
                        arcfile2.taxonomy.primary_section.referent.id = "";
                        arcfile2.taxonomy.primary_site.referent.id = ""; 
                        arcfile2.websites = {"el-espectador":{}}
                    }
                }               
            }else{
                arcfile2.taxonomy.sites[0].referent.id = "";
                arcfile2.taxonomy.sections[0].referent.id = "";
                arcfile2.taxonomy.primary_section.referent.id = "";
                arcfile2.taxonomy.primary_site.referent.id = ""; 
                arcfile2.websites = {"el-espectador":{}}
            }
                        
            // Peticion
            const arcRequest2 = {
                method: 'PUT',
                uri: `${environment}/story/v2/story/${req.params.id}`,
                auth: {bearer: `${bearer}`},
                body: JSON.stringify(arcfile2)
            };
            
            const resultRequest2 = await request(arcRequest2);
            const jsonResultRequest2 = JSON.parse(resultRequest2);                        
            res.send(jsonResultRequest2._id);          
            arcfile2.content_elements= [{
                "type": "text",
                "content": ""
            }];                            
            arcfile2.promo_items={};            
            arcfile2.taxonomy.tags = [];
            arcfile2.taxonomy.seo_keywords = [];             
        }else{
            return res.status(404).send('This content is not an article');
        }
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});


module.exports = router;