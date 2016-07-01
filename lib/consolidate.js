var _ = require('lodash');
var Immutable from 'immutable';

var SchemaRecord = Record({
  id: '',
  html_id: '',
  title: '',
  description: '',
  extended_description: '',
  object_definition: null,
  links: Immutable.List(),
  link_errors: Immuatble.List(),
  section_notes: Immutable.List(),
});

var schema = new SchemaRecord({

})


var Link = Record({
  method,
  title,
  beta,
  permissions_required,
  plan_availability,
  description,
  uri,
  parameters,
  curl,
  response,
});



var consolidate = function(schema) {
  options = options || {};
  return _.omit(
    _.extend(schema, {
      // HTML-ready identifier
      htmlID: _sanitizeHTMLID(schema.title),
      // Links are the available HTTP endpoints to interact with the object(s)
      links: transformLinks(schema, schema.links || [], options),
      // Object definition. Provides name, type, description, example, etc. for the schema.
      objectDefinition: generateObjectDefinition(schema)
    }),
    ['definition', 'properties']
  );
};