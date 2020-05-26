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
    let arcfile = require('../templates/gn4-arc');
    const gn4file = req.body;
    const { title, body, field_usuario_gn4_id, field_gn4_id, field_fecha_publi_text, field_tags, type, field_teaser, field_section_text} = gn4file; 
    
    if (title && body && field_fecha_publi_text && field_gn4_id && type){
        /*Campos requeridos de ARC*/
        if (type == 'column'){
            arcfile.headlines.basic = title;
            arcfile.headlines.meta_title = title;      
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
            
            //sections
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
                        arcfile.websites = {}
                    }
                }                
            }else{
                arcfile.taxonomy.sites[0].referent.id = "";
                arcfile.taxonomy.sections[0].referent.id = "";
                arcfile.taxonomy.primary_section.referent.id = "";
                arcfile.taxonomy.primary_site.referent.id = ""; 
                arcfile.websites = {}
            }
            
            const arcRequest = {
                method: 'POST',
                uri: `${environment}/story/v2/story`,
                auth: {bearer: `${bearer}`},
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
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
    
});

router.put('/:id', ensureToken, async (req, res) => {
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    let arcfile2 = require('../templates/gn4-arc-2');
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
            arcfile2._id = req.params.id;
            arcfile2.revision = arc_revision_id;
            arcfile2.headlines.basic = title;
            arcfile2.headlines.meta_title = title;
            arcfile2.content_elements[0].content = body.und[0].value;  
            arcfile2.description.basic = field_teaser.und[0].value;                       
            arcfile2.first_publish_date = field_fecha_publi_text.und[0].value;            
            arcfile2.source.source_id = field_gn4_id.und[0].value;
            arcfile2.additional_properties.publish_date = field_fecha_publi_text.und[0].value;           
            arcfile2.subtype = type;
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

                arcfile2.taxonomy.tags = arcTags;
                arcfile2.taxonomy.seo_keywords = gn4Tags;            
            }

            //sections
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
                        arcfile2.websites = {}
                    }
                }                
            }else{
                arcfile2.taxonomy.sites[0].referent.id = "";
                arcfile2.taxonomy.sections[0].referent.id = "";
                arcfile2.taxonomy.primary_section.referent.id = "";
                arcfile2.taxonomy.primary_site.referent.id = ""; 
                arcfile2.websites = {}
            }
            
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
        }else{
            return res.status(404).send('This content is not a column');
        }
                
    }else{
        return res.status(404).send('The required fields have not been complete');
    }
        
});

module.exports = router;