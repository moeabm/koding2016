/*
    OpenCalais.js - Node JS OpenCalais Client library

    This library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Module dependencies
 */

var request = require('superagent'),
  builder = require('xmlbuilder');

/*
 * Constructor
 *
 * @param {auth} DocumentCloud basic auth
 * @return {Object} new instance
 */

function OpenCalais(licenseID) {
  this.licenseID = licenseID;
  return this;
};

/*
 * Version
 */

OpenCalais.version = '0.1.0';

/*
 * Create OpenCalais prototypes
 */

OpenCalais.prototype.request = function(content, params, callback) {
  APIRequest.call(this, content, params, callback);
  return this;
};

/*
 * Process API requests
 */

var APIRequest = function(content, params, callback) {
  var self = this;

  // convert JSON content to XML content (opencalais don't support JSON as contentType for input)
  if (params.contentType == "application/json") {
    content = builder.create({"doc" : content}).end({pretty: false});
    params.contentType = "text/xml";
  }

  // generate request
  var req = request.post('https://api.opencalais.com/enlighten/rest/')
    .set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8')
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36')
    .buffer(true)
    .send({"licenseID":self.licenseID,"paramsXML":setParams(params),"content":content})
    .end(function(res) {
      var response = (Object.keys(res.body).length) ? res.body : res.text;
      if (res.error) {
        // execute callback on error
        callback(res.error, {
          'error': res.error,
          'status': res.statusCode,
          'response': response
        })
      } else {
        // execute callback on response
        callback(res.error, response);
      }
    });
};

var setParams = function (params) {
  params = params || {};
  var paramsJSON = {
    "oc:params": {
      "@xmlns:oc": "http://s.opencalais.com/1/pred/",
      "@xmlns:rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "oc:externalMetadata": (typeof params.externalMetadata !== "undefined") ? params.externalMetadata : ""
    }
  };

  /*
   *  Generating Directives
   */

  var directives = {
    "processingDirectives": [
      {
        "name": "outputFormat",
        "default": "application/json"
      }, {
        "name": "contentType",
        "default": null
      }, {
        "name": "reltagBaseURL",
        "default": null
      }, {
        "name": "calculateRelevanceScore",
        "default": true
      }, {
        "name": "enableMetadataType",
        "default": null
      }, {
        "name": "externalID",
        "default": null
      }, {
        "name": "docRDFaccessible",
        "default": null
      }, {
        "name": "discardMetadata",
        "default": ";"
      }
    ],
    "userDirectives": [
      {
        "name": "allowDistribution",
        "default": false
      }, {
        "name": "allowSearch",
        "default": false
      }, {
        "name": "submitter",
        "default": null
      }
    ],
    "generate" : function (thisParam) {
      for (var directive in this) {
        if (directive != "generate") {
          thisParam["oc:"+directive] = {};
          this[directive].forEach(function (param) {
            param.exist = (typeof params[param.name] !== "undefined");
            if ((param.default !== null) || param.exist) {
              thisParam["oc:"+directive]["@oc:"+param.name] = (param.exist) ? params[param.name] : param.default;
            }
          });
        }
      };
    }
  };

  directives.generate(paramsJSON["oc:params"]);

  /*
   * Generating paramXML
   */

  return builder.create(paramsJSON).end({pretty: false});
};

/*
 * Export new constructor wrapper
 */

module.exports = function(licenseID) {
  return new OpenCalais(licenseID);
};