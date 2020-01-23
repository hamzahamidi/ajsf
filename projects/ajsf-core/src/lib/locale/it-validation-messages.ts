export const itValidationMessages: any = { // Default Italian error messages
  required: 'Il campo è obbligatorio',
  minLength: 'Deve inserire almeno {{minimumLength}} caratteri (lunghezza corrente: {{currentLength}})',
  maxLength: 'Il numero massimo di caratteri consentito è {{maximumLength}} (lunghezza corrente: {{currentLength}})',
  pattern: 'Devi rispettare il pattern : {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Deve essere una data, come "31-12-2000"';
      case 'time':
        return 'Deve essere un orario, come "16:20" o "03:14:15.9265"';
      case 'date-time':
        return 'Deve essere data-orario, come "14-03-2000T01:59" or "14-03-2000T01:59:26.535Z"';
      case 'email':
        return 'Deve essere un indirzzo email, come "name@example.com"';
      case 'hostname':
        return 'Deve essere un hostname, come "example.com"';
      case 'ipv4':
        return 'Deve essere un indirizzo IPv4, come "127.0.0.1"';
      case 'ipv6':
        return 'Deve essere un indirizzo IPv6, come "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return 'Deve essere un url, come "http://www.example.com/page.html"';
      case 'uuid':
        return 'Deve essere un uuid, come "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return 'Deve essere un colore, come "#FFFFFF" o "rgb(255, 255, 255)"';
      case 'json-pointer':
        return 'Deve essere un JSON Pointer, come "/pointer/to/something"';
      case 'relative-json-pointer':
        return 'Deve essere un JSON Pointer relativo, come "2/pointer/to/something"';
      case 'regex':
        return 'Deve essere una regular expression, come "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return 'Deve essere formattato correttamente ' + error.requiredFormat;
    }
  },
  minimum: 'Deve essere {{minimumValue}} o più',
  exclusiveMinimum: 'Deve essere più di {{exclusiveMinimumValue}}',
  maximum: 'Deve essere {{maximumValue}} o meno',
  exclusiveMaximum: 'Deve essere minore di {{exclusiveMaximumValue}}',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Deve avere ${decimals} o meno decimali.`;
    } else {
      return `Deve essere multiplo di ${error.multipleOfValue}.`;
    }
  },
  minProperties: 'Deve avere {{minimumProperties}} o più elementi (elementi correnti: {{currentProperties}})',
  maxProperties: 'Deve avere {{maximumProperties}} o meno elementi (elementi correnti: {{currentProperties}})',
  minItems: 'Deve avere {{minimumItems}} o più elementi (elementi correnti: {{currentItems}})',
  maxItems: 'Deve avere {{maximumItems}} o meno elementi (elementi correnti: {{currentItems}})',
  uniqueItems: 'Tutti gli elementi devono essere unici',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
