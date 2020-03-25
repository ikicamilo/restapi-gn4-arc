const { Router } = require('express');
const router = Router();
const fs = require('fs');
const request = require('request-promise');
const multiparty = require('multiparty');
const arcfile = require('../templates/gn4-arc');

router.post('/', (req, res) => { 
    
    const form = new multiparty.Form();
    form.parse(req, async function(err, fields, files) {
        
        console.log(files.image);
        console.log(files);
        const arcRequest = {
            method: 'POST',
            url: `https://api.sandbox.elespectador.arcpublishing.com/photo/api/v2/photos`,
            auth: {bearer: 'R00FLRMTJ7OC78G13494UDJ85TJ51JSHIcjQk6x5vMDSvphCh9IpqVeBKf+YsjaMHHR9yPrb'},
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
        res.send(resultRequest);

        arcfile.content_elements[1]._id = resultRequest.body._id;
        arcfile.content_elements[1].caption = files.caption;
        arcfile.content_elements[1].additional_properties = resultRequest.body.additional_properties;
        
        const json_arcfile = JSON.stringify(arcfile);
        fs.writeFileSync('src/templates/gn4-arc.json', json_arcfile, 'utf-8');
    });               
});

module.exports = router;