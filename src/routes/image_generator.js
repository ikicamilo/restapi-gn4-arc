const { Router } = require('express');
const router = Router();
const fs = require('fs');
const request = require('request-promise');
const multiparty = require('multiparty');
//const arcfile = require('../templates/gn4-arc');
const verifyToken = require('../controllers/verifyToken');
const ensureToken = require('../controllers/ensureToken');
const path = require('path');

router.post('/', ensureToken, (req, res) => { 
    const environment = req.app.get('environment');
    const bearer = req.app.get('bearer');
    const avaibleExtensions = ['.jpeg', '.jpg', '.png','.tif','.eps'];
    const form = new multiparty.Form();
    form.parse(req, async function(err, fields, files) {
                
        if (files.image && files.image[0].originalFilename !== '' && typeof files.image !== 'undefined'){
            if (avaibleExtensions.includes(path.extname(files.image[0].originalFilename))){
                const arcRequest = {
                    method: 'POST',
                    url: `${environment}/photo/api/v2/photos`,
                    auth: {bearer: `${bearer}`},
                    formData: {
                        file: {
                            value: fs.createReadStream(files.image[0].path),
                            options: {
                                filename: files.image[0].originalFilename,
                                contentType: files.image[0].headers["content-type"]
                            }
                        }
                    },
                    json: true,
                    resolveWithFullResponse: true
                };                
                const resultRequest = await request(arcRequest);
                res.send(resultRequest.body._id);
            }else{
                return res.status(404).send('File extension is not available');
            }                        
        }else{
            return res.status(404).send('Image not found');
        }
    });               
});

module.exports = router;