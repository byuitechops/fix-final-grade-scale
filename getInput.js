/* eslint-env node, browser*/
/* eslint no-unused-vars:0 , no-console:0*/

var prompt = require('prompt');

//All the things that prompt will ask for
var promptSettings = [
    {
        name: 'gradeScale',
        message: "What grade scale do you want the final grade to be set to?"
    },
    {
        name: 'ouFile',
        message: "Name of ou list csv file",
        pattern: /.*\.csv/
    },
    {
        name: 'domain',
        message: "Which domain? Type 'p' for Pathway and anything else for BYUI"
    },
    {
        name: 'username',
        required: true
    },
    {
        name: 'password',
        hidden: true,
        replace: '*',
        required: true
    }
  ];

function readInCsv(name, cb) {
    var dsv = require('d3-dsv'),
        fs = require('fs');

    fs.readFile('./' + name, "utf8", function (err, file) {
        if (err) {
            cb(err, null);
            return;
        }

        //no err 
        var fileObj = dsv.csvParse(file),
            gotNames = fileObj.columns.includes('name'),
            gotOus = fileObj.columns.includes('ou');

        //got what we need?
        if (!gotNames) {
            cb(new Error("The csv file supplied does not have a 'name' column. Try again."), null)
        } else if (!gotOus) {
            cb(new Error("The csv file supplied does not have a 'ou' column. Try again."), null)
        } else {
            cb(null, fileObj);
        }
    });
}

module.exports = function (callback) {
    function promptCB(err, promptData) {
        if (err) {
            callback(err, null);
            return;
        }

        //which domain are we in?
        if (promptData.domain.toLowerCase() === 'p') {
            promptData.urlPrefix = "https://pathway.brightspace.com";
        } else {
            promptData.urlPrefix = "https://byui.brightspace.com";
        }

        //get read the csv file in
        readInCsv(promptData.ouFile, function (err, fileObj) {
            //problems with the csv file?
            if (err) {
                callback(err, null);
            }

            //guess not
            promptData.ouList = fileObj;
            callback(null, promptData);
        });
    }

    //set up prompt
    prompt.get(promptSettings, promptCB);
    //Run Prompt
    prompt.start();
}
