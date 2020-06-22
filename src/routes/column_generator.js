const { Router } = require('express');
const router = Router();
//const fs = require('fs');
const request = require('request-promise');
//const arcfile = require('../templates/gn4-arc');
const verifyToken = require('../controllers/verifyToken');
const sectionsFile = require('../templates/sections');
const ensureToken = require('../controllers/ensureToken');


router.post('/', ensureToken, async (req, res) => { 
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    let arcfile3 = require('../templates/gn4-arc-3');
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type, field_teaser, field_section_text} = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        /*Campos requeridos de ARC*/
        if (type == 'column'){
            arcfile3.headlines.basic = title;
            arcfile3.headlines.meta_title = title;      
            arcfile3.content_elements[0].content = body.und[0].value; 
            arcfile3.description.basic = field_teaser.und[0].value;                       
            arcfile3.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile3.source.source_id = field_gn4_id.und[0].value;
            arcfile3.additional_properties.publish_date = field_fecha_publi_text.und[0].value;           
            arcfile3.subtype = type;
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

                arcfile3.taxonomy.tags = arcTags;
                arcfile3.taxonomy.seo_keywords = gn4Tags;            
            }
            
            //sections
            if (field_section_text){
                const drupalSectionStructure = field_section_text.und[0].value.split(";;");
                const sectionDrupal = drupalSectionStructure[1];
                for (let i = 0; i < sectionsFile.sections.length; i++) {                    
                    if(sectionsFile.sections[i].gn4Section == sectionDrupal){                        
                        arcfile3.taxonomy.sites[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile3.taxonomy.sections[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile3.taxonomy.primary_section.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile3.taxonomy.primary_site.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile3.websites = {
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
                        arcfile3.taxonomy.sites[0].referent.id = "";
                        arcfile3.taxonomy.sections[0].referent.id = "";
                        arcfile3.taxonomy.primary_section.referent.id = "";
                        arcfile3.taxonomy.primary_site.referent.id = ""; 
                        arcfile3.websites = {}
                    }
                }                
            }else{
                arcfile3.taxonomy.sites[0].referent.id = "";
                arcfile3.taxonomy.sections[0].referent.id = "";
                arcfile3.taxonomy.primary_section.referent.id = "";
                arcfile3.taxonomy.primary_site.referent.id = ""; 
                arcfile3.websites = {}
            }
            
            const arcRequest3 = {
                method: 'POST',
                uri: `${environment}/story/v2/story`,
                auth: {bearer: `${bearer}`},
                body: JSON.stringify(arcfile3)
            };
            
            const resultRequest3 = await request(arcRequest3);
            const jsonResultRequest3 = JSON.parse(resultRequest3);                        
            res.send(jsonResultRequest3._id);
            arcfile3.promo_items={}; 
            arcfile3.taxonomy.tags = [];
            arcfile3.taxonomy.seo_keywords = [];             
        }else{
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
    
});

router.put('/:id', ensureToken, async (req, res) => {
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    let arcfile4 = require('../templates/gn4-arc-4');
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
            return res.status(404).send('Column not found');
        });                
    
    if (resultRequest.body.subtype !== 'column'){
        return res.status(404).send('The id does not belong to a column');
    }
     
    const arc_revision_id = {      
        "parent_id": resultRequest.body.revision.revision_id    
    }
    
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type, field_teaser, field_section_text } = gn4file; 

    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        /*Campos requeridos de ARC*/
        if (type == 'column'){
            arcfile4._id = req.params.id;
            arcfile4.revision = arc_revision_id;
            arcfile4.headlines.basic = title;
            arcfile4.headlines.meta_title = title;
            arcfile4.content_elements[0].content = body.und[0].value;  
            arcfile4.description.basic = field_teaser.und[0].value;                       
            arcfile4.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile4.source.source_id = field_gn4_id.und[0].value;
            arcfile4.additional_properties.publish_date = field_fecha_publi_text.und[0].value;           
            arcfile4.subtype = type;
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

                arcfile4.taxonomy.tags = arcTags;
                arcfile4.taxonomy.seo_keywords = gn4Tags;            
            }

            //sections
            if (field_section_text){
                const drupalSectionStructure = field_section_text.und[0].value.split(";;");
                const sectionDrupal = drupalSectionStructure[1];
                for (let i = 0; i < sectionsFile.sections.length; i++) {                    
                    if(sectionsFile.sections[i].gn4Section == sectionDrupal){                        
                        arcfile4.taxonomy.sites[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile4.taxonomy.sections[0].referent.id = sectionsFile.sections[i].arcSection;
                        arcfile4.taxonomy.primary_section.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile4.taxonomy.primary_site.referent.id = sectionsFile.sections[i].arcSection;
                        arcfile4.websites = {
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
                        arcfile4.taxonomy.sites[0].referent.id = "";
                        arcfile4.taxonomy.sections[0].referent.id = "";
                        arcfile4.taxonomy.primary_section.referent.id = "";
                        arcfile4.taxonomy.primary_site.referent.id = ""; 
                        arcfile4.websites = {
                            "el-espectador":{}
                        }
                    }
                }                
            }else{
                arcfile4.taxonomy.sites[0].referent.id = "";
                arcfile4.taxonomy.sections[0].referent.id = "";
                arcfile4.taxonomy.primary_section.referent.id = "";
                arcfile4.taxonomy.primary_site.referent.id = ""; 
                arcfile4.websites = {
                    "el-espectador":{}
                }
            }
            
            const arcRequest4 = {
                method: 'PUT',
                uri: `${environment}/story/v2/story/${req.params.id}`,
                auth: {bearer: `${bearer}`},
                body: JSON.stringify(arcfile4)
            };
            
            const resultRequest4 = await request(arcRequest4);
            const jsonResultRequest4 = JSON.parse(resultRequest4);                        
            res.send(jsonResultRequest4._id); 
            arcfile4.promo_items={};
            arcfile4.taxonomy.tags = [];
            arcfile4.taxonomy.seo_keywords = [];          
        }else{
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});

module.exports = router;